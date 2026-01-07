/**
 * Module dependencies.
 */
import { h } from 'vue';

/**
 * MD5 hash function using Web Crypto API
 */
async function md5(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Plugin setup.
 */
export default {
  install: (app) => {
    app.component('VGravatar', {
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
        return {
          finalSize: 200,
          hash: '',
        };
      },
      computed: {
        gravatarUrl() {
          if (!this.hash) return '';
          return `https://www.gravatar.com/avatar/${this.hash}?s=${this.finalSize}&d=mp`;
        },
      },
      watch: {
        async email(newEmail) {
          this.hash = await md5(newEmail.trim().toLowerCase());
        },
      },
      async mounted() {
        this.hash = await md5(this.email.trim().toLowerCase());
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
      render() {
        return h('img', {
          src: this.gravatarUrl,
        });
      },
    });
  },
};
