<!--
  HomeContactComponent
  ====================
  Contact form section with subject and message fields.

  USAGE:
  <homeContactComponent v-if="config.home.contact" />

  CONFIG EXAMPLE (config.home.contact):
  contact: {
    title: 'Feel free to contact us',
    mail: 'mailto:contact@example.com',
    style: {
      section: { background: 'background' },
    },
  }
-->
<template>
  <section id="contact" :style="sectionStyle">
    <v-container :style="containerStyle">
      <v-row align="center" justify="center" class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="config.home.contact"></homeContentComponent>
        </v-col>
        <v-col>
          <v-form ref="form">
            <v-text-field v-model="subject" :flat="config.vuetify.theme.flat" name="subject" label="Subject*"></v-text-field>
            <v-textarea v-model="body" :flat="config.vuetify.theme.flat" label="Message*"></v-textarea>
            <v-btn
              :color="theme.current.colors.secondary"
              :style="{
                color: theme.current.colors.onSecondary,
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
import { useTheme } from 'vuetify';
import { useHomeStore } from '../stores/home.store';
import { style, overlapStyle } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';

/**
 * Export default
 */
export default {
  name: 'HomeContactComponent',
  components: {
    homeContentComponent,
  },
  props: {},
  data() {
    const theme = useTheme();
    return {
      save: false,
      theme,
    };
  },
  computed: {
    variant() {
      return this.config.home.contact?.variant || 'default';
    },
    containerStyle() {
      return {
        'max-width': this.config.vuetify.theme.maxWidth,
        ...overlapStyle(this.config.home.contact?.overlap, this.$vuetify?.display),
      };
    },
    sectionStyle() {
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.config.home.contact),
        background: bgColor,
      };
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
