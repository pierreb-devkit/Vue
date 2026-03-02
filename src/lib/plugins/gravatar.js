/**
 * Module dependencies.
 */
import { h } from 'vue';

/**
 * SHA-256 hash function using Web Crypto API (Gravatar supports SHA-256 since 2024).
 * @param {string} message - The string to hash.
 * @returns {Promise<string>} Lowercase hex digest.
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
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
        /**
         * Recomputes the SHA-256 hash whenever the email prop changes.
         * @param {string} newEmail - The updated email address.
         * @returns {Promise<void>} Resolves once the hash is updated.
         */
        async email(newEmail) {
          this.hash = await sha256(newEmail.trim().toLowerCase());
        },
      },
      /**
       * Computes the initial SHA-256 hash of the email prop on mount.
       * @returns {Promise<void>} Resolves once the hash is set.
       */
      async mounted() {
        this.hash = await sha256(this.email.trim().toLowerCase());
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
