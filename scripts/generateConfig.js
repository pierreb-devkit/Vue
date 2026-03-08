/* eslint-disable */

import fs from 'fs';
import _ from 'lodash';
import objectPath from 'object-path';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import glob from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the current config
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

/**
 * Load and merge all module config files matching the given environment.
 * Globs `src/modules/&ast;/config/config.<env>.js` and deep-merges them.
 * @param {string} env - Environment name (e.g. 'development', 'production')
 * @returns {Promise<Object>} Merged config object from all matching module files
 */
const loadModuleConfigs = async (env) => {
  const pattern = `src/modules/*/config/config.${env}.js`;
  const files = glob.sync(pattern, { cwd: process.cwd(), absolute: true }).sort();
  let merged = {};
  for (const file of files) {
    console.log(`  + Module config: ${path.relative(process.cwd(), file)}`);
    const mod = await import(pathToFileURL(file).href);
    merged = _.merge(merged, mod.default);
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
    config = _.merge(config, globalDev);
  }

  // 3. If not development, overlay env-specific configs
  if (env !== 'development') {
    // Module env overrides
    console.log(`+ Loading module ${env} overrides...`);
    const moduleEnv = await loadModuleConfigs(env);
    config = _.merge(config, moduleEnv);

    // Global env overrides
    console.log(`+ Loading global ${env} overrides...`);
    const globalEnv = await loadGlobalConfig(env);
    if (globalEnv) {
      config = _.merge(config, globalEnv);
    }
  }

  // 4. DEVKIT_VUE_* env var overrides (final layer)
  const environmentVars = _.mapKeys(
    _.pickBy(process.env, (_value, key) => key.startsWith('DEVKIT_VUE_')),
    (_v, k) => k.split('_').slice(2).join('.'),
  );
  const environmentConfigVars = {};
  _.forEach(environmentVars, (v, k) => objectPath.set(environmentConfigVars, k, v));
  config = _.merge(config, environmentConfigVars);

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
 * it' a generated one
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
