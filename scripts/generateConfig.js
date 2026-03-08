import fs from 'fs';
import { mapKeys, pickBy, forEach } from 'lodash-es';
import objectPath from 'object-path';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * @desc Deep merge two objects, replacing arrays instead of merging by index.
 * @param {Object} target - Base object
 * @param {Object} source - Override object
 * @returns {Object} Merged result (new object, inputs are not mutated)
 */
const deepMerge = (target, source) => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = result[key];
    if (Array.isArray(srcVal)) {
      result[key] = srcVal;
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
 * Discover module config files for a given environment by scanning src/modules.
 * @param {string} env - Environment name (e.g. 'development', 'production')
 * @returns {string[]} Sorted list of absolute paths to matching config files
 */
const discoverModuleConfigs = (env) => {
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  if (!fs.existsSync(modulesDir)) return [];
  return fs
    .readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(modulesDir, d.name, 'config', `config.${env}.js`))
    .filter((f) => fs.existsSync(f))
    .sort();
};

/**
 * Load and merge all module config files matching the given environment.
 * @param {string} env - Environment name (e.g. 'development', 'production')
 * @returns {Promise<Object>} Merged config object from all matching module files
 */
const loadModuleConfigs = async (env) => {
  const files = discoverModuleConfigs(env);
  let merged = {};
  for (const file of files) {
    console.log(`  + Module config: ${path.relative(process.cwd(), file)}`);
    const mod = await import(pathToFileURL(file).href);
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
  const filePath = path.join(process.cwd(), 'src', 'config', 'defaults', `config.${env}.js`);
  if (fs.existsSync(filePath)) {
    console.log(`  + Global config: config.${env}.js`);
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

  // 1. Module development defaults (base layer)
  console.log('+ Loading module development defaults...');
  let config = await loadModuleConfigs('development');

  // 2. Global development defaults
  console.log('+ Loading global development defaults...');
  const globalDev = await loadGlobalConfig('development');
  if (globalDev) {
    config = deepMerge(config, globalDev);
  }

  // 3. If not development, overlay env-specific configs
  if (env !== 'development') {
    // Module env overrides
    console.log(`+ Loading module ${env} overrides...`);
    const moduleEnv = await loadModuleConfigs(env);
    config = deepMerge(config, moduleEnv);

    // Global env overrides
    console.log(`+ Loading global ${env} overrides...`);
    const globalEnv = await loadGlobalConfig(env);
    if (globalEnv) {
      config = deepMerge(config, globalEnv);
    } else if (Object.keys(moduleEnv).length === 0) {
      console.warn(`+ Warning: No configuration overrides found for "${env}" environment — using development defaults`);
    }
  }

  // 4. DEVKIT_VUE_* env var overrides (final layer)
  const environmentVars = mapKeys(
    pickBy(process.env, (_value, key) => key.startsWith('DEVKIT_VUE_')),
    (_v, k) => k.split('_').slice(2).join('.'),
  );
  const environmentConfigVars = {};
  forEach(environmentVars, (v, k) => objectPath.set(environmentConfigVars, k, v));
  config = deepMerge(config, environmentConfigVars);

  // Generate ESM version
  const configJSON = JSON.stringify(config, undefined, 2)
    .replace(/"([^(")"]+)":/g, '$1:')
    .replace(/\n|\r/g, ',\n')
    .replace(/{,/g, '{')
    .replace(/\[,/g, '[')
    .replace(/,,/g, ',');

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
