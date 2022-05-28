/**
 * Module dependencies.
 */
import { h } from 'vue';
import md5 from 'md5';

/**
 * Plugin Setup
 */
export default {
  install: (app) => {
    app.component('v-gravatar', {
      props: {
        email: {
          type: String,
          default: 'default',
        },
        size: {
          type: [Number, String],
          default: 200,
        },
        tag: {
          type: String,
          default: 'div',
        },
      },
      data() {
        return { finalSize: 200 };
      },
      created() {
        this.finalSize = Number(this.size);

        if (this.finalSize < 24) {
          this.finalSize = 24;
        }

        if (this.finalSize > 2048) {
          this.finalSize = 2048;
        }
      },
      computed: {
        gravatarUrl() {
          const hash = md5(this.email.trim().toLowerCase());
          return `https://www.gravatar.com/avatar/${hash}?s=${this.finalSize}&d=mp`;
        },
      },
      render() {
        return h('img', {
          src: this.gravatarUrl,
        });
      },
    });
  },
};
