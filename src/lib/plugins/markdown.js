/**
 * Module dependencies.
 */
import { marked } from 'marked';

/**
 * Plugin Setup
 */
export default {
  install: (app) => {
    app.component('v-markdown', {
      props: ['source'],
      computed: {
        markup() {
          return marked.parse(this.source, {
            mangle: false,
            headerIds: false,
          });
        },
      },
      template: '<span v-html="markup"></span>',
    });
  },
};
