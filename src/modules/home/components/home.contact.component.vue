<template>
  <section id="contact" :style="style('section', config.home.contact)">
    <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
      <v-row align="center" justify="center" class="px-0 py-8">
        <homeTitleComponent :setup="config.home.contact"></homeTitleComponent>
        <v-col>
          <v-form ref="form">
            <v-text-field v-model="subject" :flat="config.vuetify.theme.flat" name="subject" label="Subject*"></v-text-field>
            <v-textarea v-model="body" :flat="config.vuetify.theme.flat" label="Message*"></v-textarea>
            <v-btn
              :color="config.vuetify.theme.themes[theme].colors.secondary"
              :style="{
                color: config.vuetify.theme.themes[theme].colors.onSecondary,
              }"
              depressed
              x-large
              @click="sendMail()"
              >Send</v-btn
            >
          </v-form>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useCoreStore } from '../../core/stores/core.store';
import { useHomeStore } from '../stores/home.store';
import { style } from '../../../lib/helpers/theme';
import homeTitleComponent from './utils/home.title.component.vue';

/**
 * Export default
 */
export default {
  name: 'HomeContactComponent',
  components: {
    homeTitleComponent,
  },
  computed: {
    theme() {
      const coreStore = useCoreStore();
      return coreStore.theme;
    },
    contact() {
      const homeStore = useHomeStore();
      return homeStore.contact;
    },
    subject: {
      get() {
        return this.contact.subject;
      },
      set(subject) {
        this.save = true;
        const homeStore = useHomeStore();
        homeStore.updateContact({ subject });
      },
    },
    body: {
      get() {
        return this.contact.body;
      },
      set(body) {
        this.save = true;
        const homeStore = useHomeStore();
        homeStore.updateContact({ body });
      },
    },
  },
  methods: {
    style,
    sendMail() {
      window.location.href = `${this.config.home.contact.mail}?subject=${this.contact.subject}&body=${this.contact.body.replace(/\n/g, '%0D%0A')}`;
      this.$refs.form.reset();
    },
  },
};
</script>
