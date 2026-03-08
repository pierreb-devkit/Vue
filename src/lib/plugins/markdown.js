/**
 * Module dependencies.
 */
import { marked } from 'marked';
import DOMPurify from 'dompurify';
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
        inline: {
          type: Boolean,
          default: false,
        },
      },
      /**
       * Render markdown source as sanitized HTML.
       * @returns {VNode|null} A div (block) or span (inline) vnode, or null when source is empty.
       */
      render() {
        if (!this.source) return null;
        try {
          const html = this.inline ? marked.parseInline(this.source) : marked.parse(this.source);
          const safe = DOMPurify.sanitize(html);
          return this.inline ? h('span', { innerHTML: safe }) : h('div', { innerHTML: safe });
        } catch (error) {
          console.error('Markdown parsing error:', error);
          return this.inline ? h('span', this.source) : h('div', this.source);
        }
      },
    });
  },
};
