/**
 * Module dependencies.
 */

/**
 * Plugin setup.
 */
export default {
  /**
   * Install the images plugin — registers `setImages` as a global Vue property.
   * @param {import('vue').App} app - The Vue application instance.
   * @returns {void}
   */
  install: (app) => {
    /**
     * Build a URL to an uploaded image, optionally appending a size and/or operation
     * suffix to the filename. Omits the port segment when `api.port` is empty or undefined.
     * @param {{protocol: string, host: string, port?: string}} api - API config (protocol, host, optional port).
     * @param {string} file - Filename with a single extension (e.g. `photo.jpg`).
     * @param {string|null} size - Size suffix to append before the extension (e.g. `200x200`), or null.
     * @param {string|null} operation - Operation suffix to append before the extension (e.g. `crop`), or null.
     * @returns {string} The resolved image URL, or the original `file` if it does not have exactly one extension.
     */
    app.config.globalProperties.setImages = (api, file, size, operation) => {
      const base = file.split('.');
      if (base.length !== 2) return file;
      let [name] = base;
      if (size) name = `${name}-${size}`;
      if (operation) name = `${name}-${operation}`;
      name = `${name}.${base[1]}`;
      const port = api.port ? `:${api.port}` : '';
      return `${api.protocol}://${api.host}${port}/api/uploads/images/${name}`;
    };
  },
};
