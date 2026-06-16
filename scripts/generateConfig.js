import fs from 'fs';
import { mapKeys, pickBy, forEach } from 'lodash-es';
import objectPath from 'object-path';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Deep merge two objects, replacing arrays instead of merging by index.
 * @param {Object} target - Base object
 * @param {Object} source - Override object
 * @returns {Object} Merged result (new object, inputs are not mutated)
 */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const deepMerge = (target, source) => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (UNSAFE_KEYS.has(key)) continue;
    const srcVal = source[key];
    if (srcVal === undefined) continue;
    const tgtVal = result[key];
    if (Array.isArray(srcVal)) {
      result[key] = [...srcVal];
    } else if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal) && tgtVal && typeof tgtVal === 'object' && !Array.isArray(tgtVal)) {
      result[key] = deepMerge(tgtVal, srcVal);
    } else {
      result[key] = srcVal;
    }
  }
  return result;
};

// Get the current config
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

/**
 * Discover module config files by scanning src/modules for all *.{env}.config.js files.
 * @param {string} env - Environment suffix to match (e.g. 'development', a downstream project name)
 * @returns {string[]} Sorted list of absolute paths to matching config files
 */
const discoverModuleConfigs = (env = 'development') => {
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  if (!fs.existsSync(modulesDir)) return [];
  const suffix = `.${env}.config.js`;
  const files = [];
  for (const d of fs.readdirSync(modulesDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const configDir = path.join(modulesDir, d.name, 'config');
    if (!fs.existsSync(configDir)) continue;
    for (const f of fs.readdirSync(configDir)) {
      if (f.endsWith(suffix)) {
        files.push(path.join(configDir, f));
      }
    }
  }
  return files.sort();
};

/**
 * Load and merge all module config files for a given environment.
 * @param {string} env - Environment suffix (e.g. 'development', a downstream project name)
 * @returns {Promise<Object>} Merged config object from all matching module files
 */
const loadModuleConfigs = async (env = 'development') => {
  const files = discoverModuleConfigs(env);
  let merged = {};
  for (const file of files) {
    console.log(`  + Module config: ${path.relative(process.cwd(), file)}`);
    const mod = await import(pathToFileURL(file).href);
    if (!mod.default || typeof mod.default !== 'object' || Array.isArray(mod.default)) {
      const actual = mod.default === null ? 'null' : Array.isArray(mod.default) ? 'array' : typeof mod.default;
      console.warn(`  ⚠ Skipping ${path.relative(process.cwd(), file)}: default export is ${actual}, expected a plain object`);
      continue;
    }
    merged = deepMerge(merged, mod.default);
  }
  return merged;
};

/**
 * Load a global config file for the given environment.
 * @param {string} env - Environment name (e.g. 'development', 'production')
 * @returns {Promise<Object|null>} The default export object, or null if file does not exist
 */
const loadGlobalConfig = async (env) => {
  const filePath = path.join(process.cwd(), 'src', 'config', 'defaults', `${env}.config.js`);
  if (fs.existsSync(filePath)) {
    console.log(`  + Global config: ${env}.config.js`);
    const mod = await import(pathToFileURL(filePath).href);
    return mod.default;
  }
  return null;
};

/**
 * Build the full application configuration by merging module defaults, global
 * defaults, environment overrides, and DEVKIT_VUE_* env vars, then write the
 * generated ESM config file.
 * @returns {Promise<void>} Resolves when the config file has been written
 */
const getConfiguration = async () => {
  const env = process.env.NODE_ENV;
  console.log(`+ Configuration based on: "${env}"`);

  // 1. Module defaults (base layer)
  console.log('+ Loading module defaults...');
  let config = await loadModuleConfigs();

  // 2. Global development defaults
  console.log('+ Loading global development defaults...');
  const globalDev = await loadGlobalConfig('development');
  if (globalDev) {
    config = deepMerge(config, globalDev);
  }

  // 3 & 4. If not development, overlay project-specific configs (module then global)
  // Downstream projects set NODE_ENV to their project name (e.g. NODE_ENV=<project>).
  // Layer 3: per-module project overrides — src/modules/*/config/{module}.{project}.config.js
  // Layer 4: global project overrides    — src/config/defaults/{project}.config.js
  if (env !== 'development') {
    // Layer 3: per-module project overrides (e.g. home.<project>.config.js, auth.<project>.config.js)
    console.log(`+ Loading module ${env} overrides...`);
    const moduleEnv = await loadModuleConfigs(env);
    config = deepMerge(config, moduleEnv);

    // Layer 4: global project overrides (e.g. <project>.config.js)
    console.log(`+ Loading global ${env} overrides...`);
    const globalEnv = await loadGlobalConfig(env);
    if (globalEnv) {
      config = deepMerge(config, globalEnv);
    }

    const STANDARD_ENVS = new Set(['development', 'production', 'test']);
    const hasEnvVarOverrides = Object.keys(process.env).some((key) => key.startsWith('DEVKIT_VUE_'));
    const hasModuleOverrides = Object.keys(moduleEnv).length > 0;
    if (!STANDARD_ENVS.has(env) && !globalEnv && !hasEnvVarOverrides && !hasModuleOverrides) {
      console.warn(`+ Warning: NODE_ENV="${env}" but no ${env}.config.js found in src/config/defaults/ — using development defaults. Downstream projects should create config files (see README).`);
    }
  }

  // 5. DEVKIT_VUE_* env var overrides (final layer).
  // Empty-string values DO override (intentional clear pattern: workflow build-args
  // pass `DEVKIT_VUE_X=` to neutralize a config-file default for prod builds, e.g.
  // a dev port hardcoded in {project}.config.js that should resolve to the prod
  // ingress URL without a port segment).
  // The original Vue#4110 bug (empty ARG defaults from Dockerfile leaking into env
  // and silently zeroing config-file values) is mitigated by dropping ARG defaults
  // in the upstream Devkit Dockerfile (Vue#4112 part 1) — downstream Dockerfiles
  // must do the same to stay safe. The earlier defense-in-depth filter
  // (`value !== ''`) was over-correction: it broke the documented Layer 5 contract
  // and silently ignored explicit-clear overrides, causing a downstream prod signin
  // outage (a port from a {project}.config.js could not be cleared).
  const environmentVars = mapKeys(
    pickBy(process.env, (_value, key) => key.startsWith('DEVKIT_VUE_')),
    (_v, k) => k.split('_').slice(2).join('.'),
  );
  const environmentConfigVars = {};
  forEach(environmentVars, (v, k) => objectPath.set(environmentConfigVars, k, v));
  config = deepMerge(config, environmentConfigVars);

  // Generate ESM version.
  // JSON is a strict subset of JS object-literal syntax — quoted keys are valid
  // in ESM exports and in every JS runtime. The previous regex pipeline tried to
  // unquote keys but corrupted any string VALUE containing `:`, `{`, `}`, `,`,
  // or quotes (e.g. a curl snippet). Use plain JSON.stringify so multi-line
  // strings with quote/brace markup round-trip safely. (Fixes #4310.)
  const configJSON = JSON.stringify(config, null, 2);

  // Generate ESM file
  const esmConfigFile = `/**
 * don't edit this file /!\\
 * it's a generated one
 * edit in defaults/*, cf readme
 */
/* eslint-disable */
export default ${configJSON};
`;

  // Write ESM file
  fs.writeFileSync('./src/config/index.js', esmConfigFile);

  console.log('+ Configuration file generated: index.js');
};

getConfiguration();
