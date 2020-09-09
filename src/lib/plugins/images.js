/**
 * Module dependencies.
 */
import Vue from 'vue';

/**
 * @desc Function to generate an upload image url with options (from http://toto.png to http://toto-300-blur.png)
 * @param {Object} config.api,
 * @param {file} file - file name,
 * @param {String} size,
 * @param {String} operation,
 * @return {String} imageUrl
 */
Vue.prototype.setImages = (api, file, size, operation) => {
  const base = file.split('.');
  let name = '';
  if (base.length !== 2) return file;
  name = base[0];
  if (size) name = `${name}-${size}`;
  if (operation) name = `${name}-${operation}`;
  name = `${name}.${base[1]}`;
  return `${api.protocol}://${api.host}:${api.port}/api/uploads/images/${name}`;
};
