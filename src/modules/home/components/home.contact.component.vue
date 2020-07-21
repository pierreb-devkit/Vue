<template>
  <section id="contact" class="py-12">
    <v-container>
      <h2
        class="display-1 font-weight-bold mb-3 pb-8 text-center text-uppercase"
        v-if="config.home.contact.title"
      >{{ config.home.contact.title }}</h2>
      <v-theme-provider light>
        <v-form ref="form">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="subject"
                :flat="config.vuetify.theme.flat"
                name="subject"
                label="Subject*"
                solo
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="body" :flat="config.vuetify.theme.flat" label="Message*" solo></v-textarea>
            </v-col>
            <v-col class="mx-auto" cols="auto">
              <v-btn
                @click="sendMail()"
                :color="config.vuetify.theme.themes[theme].secondary"
                :style="{ color: config.vuetify.theme.themes[theme].onSecondary }"
                depressed
                x-large
              >Send</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-theme-provider>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
/**
 * Export default
 */
export default {
  name: 'homeContactComponent',
  computed: {
    ...mapGetters(['theme', 'contact']),
    subject: {
      get() {
        return this.contact.subject;
      },
      set(subject) {
        this.save = true;
        this.$store.commit('contact_update', { subject });
      },
    },
    body: {
      get() {
        return this.contact.body;
      },
      set(body) {
        this.save = true;
        this.$store.commit('contact_update', { body });
      },
    },
  },
  methods: {
    sendMail() {
      window.location.href = `${this.config.home.contact.mail}?subject=${
        this.contact.subject
      }&body=${this.contact.body.replace(/\n/g, '%0D%0A')}`;
      this.$refs.form.reset();
    },
  },
};
</script>
