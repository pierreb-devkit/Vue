/**
 * Plugin Setup
 */
export default {
  install: (app) => {
    app.config.globalProperties.setImages = (api, file, size, operation) => {
      const base = file.split('.');
      if (base.length !== 2) return file;
      let [name] = base;
      if (size) name = `${name}-${size}`;
      if (operation) name = `${name}-${operation}`;
      name = `${name}.${base[1]}`;
      console.log('toto');
      return `${api.protocol}://${api.host}:${api.port}/api/uploads/images/${name}`;
    };
  },
};
