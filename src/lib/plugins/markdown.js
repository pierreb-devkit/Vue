/**
 * Module dependencies.
 */
import { marked } from 'marked';
import { h } from 'vue';

/**
 * Configure marked options
 */
marked.setOptions({
  mangle: false,
  headerIds: false,
});

/**
 * Plugin setup.
 */
export default {
  install: (app) => {
    app.component('VMarkdown', {
      props: {
        source: {
          type: String,
          default: '',
        },
      },
      render() {
        if (!this.source) return null;
        try {
          const html = marked.parse(this.source);
          return h('span', { innerHTML: html });
        } catch (error) {
          console.error('Markdown parsing error:', error);
          return h('span', this.source);
        }
      },
    });
  },
};
