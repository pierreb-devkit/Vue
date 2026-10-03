<template>
  <div>
    <h3 class="text-title-medium font-weight-medium mb-1">Emails</h3>
    <p class="text-body-small text-medium-emphasis mb-4">
      Choose which product emails you receive. Account emails (password reset, verification, invitations) are always sent.
    </p>
    <v-switch
      :model-value="onboarding"
      color="primary"
      inset
      hide-details
      label="Onboarding emails"
      @update:model-value="update('onboarding', $event)"
    ></v-switch>
    <v-switch
      :model-value="news"
      color="primary"
      inset
      hide-details
      label="News and product updates"
      @update:model-value="update('news', $event)"
    ></v-switch>
  </div>
</template>

<script>
export default {
  name: 'UserEmailPreferencesComponent',
  props: {
    user: { type: Object, required: true },
  },
  emits: ['save'],
  computed: {
    /**
     * @desc Onboarding-email switch state. Absent `user.emailPreferences`
     *       (never touched by the user) reads as on, mirroring the API's default.
     * @returns {boolean}
     */
    onboarding() {
      return this.user.emailPreferences?.onboarding ?? true;
    },
    /**
     * @desc News/announcement-email switch state. Absent `user.emailPreferences`
     *       (never touched by the user) reads as on, mirroring the API's default.
     * @returns {boolean}
     */
    news() {
      return this.user.emailPreferences?.news ?? true;
    },
  },
  methods: {
    /**
     * @desc Emit the full `emailPreferences` object with one kind flipped. The
     *       API replaces the whole sub-object on write, so both keys must
     *       always be sent together — an omitted key resets to its default
     *       of `true` server-side.
     * @param {'onboarding'|'news'} kind - Which switch changed.
     * @param {boolean} value - The switch's new value.
     * @returns {void}
     */
    update(kind, value) {
      this.$emit('save', { onboarding: this.onboarding, news: this.news, [kind]: value });
    },
  },
};
</script>
