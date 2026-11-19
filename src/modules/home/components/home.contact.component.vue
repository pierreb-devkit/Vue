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
  <section id="contact" :style="styles.section">
    <v-container :max-width="config.vuetify.theme.maxWidth" :style="styles.container">
      <v-row align="center" justify="center" class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="config.home.contact"></homeContentComponent>
        </v-col>
        <v-col>
          <v-form ref="form">
            <v-text-field v-model="subject" :flat="config.vuetify.theme.flat" name="subject" label="Subject*"></v-text-field>
            <v-textarea v-model="body" :flat="config.vuetify.theme.flat" label="Message*"></v-textarea>
            <div :class="alignmentClass">
              <v-btn
                :color="theme.current.colors.secondary"
                :style="{
                  color: theme.current.colors.onSecondary,
                }"
                variant="flat"
                size="x-large"
                @click="sendMail()"
                >Send</v-btn
              >
            </div>
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
import { sectionStyles } from '../../../lib/helpers/theme';
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
    /**
     * Inline styles of the section, its container and its cards (theme helper).
     * @returns {{ section: Object, container: Object, card: Object, background: String }}
     */
    styles() {
      return sectionStyles(this.config.home.contact, this.$vuetify?.display);
    },
    variant() {
      return this.config.home.contact?.variant || 'default';
    },
    alignment() {
      return this.config.home.contact?.alignment || 'left';
    },
    alignmentClass() {
      const alignments = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      };
      return alignments[this.alignment] || 'text-left';
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
    sendMail() {
      window.location.href = `${this.config.home.contact.mail}?subject=${this.contact.subject}&body=${this.contact.body.replace(/\n/g, '%0D%0A')}`;
      this.$refs.form.reset();
    },
  },
};
</script>
