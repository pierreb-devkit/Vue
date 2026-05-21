<!--
 Example:
 <coreAvatarUploader :user="user" :size="200" endpoint="/users/avatar" @uploaded="onUploaded" />
-->
<template>
  <div class="d-inline-flex flex-column align-center">
    <v-badge
      color="primary"
      location="bottom right"
      offset-x="12"
      offset-y="12"
      bordered
    >
      <template #badge>
        <v-btn
          icon="fa-solid fa-camera"
          color="primary"
          size="small"
          variant="flat"
          density="comfortable"
          aria-label="Change avatar"
          @click="triggerUpload"
        ></v-btn>
      </template>
      <userAvatarComponent :user="user" :size="size" />
    </v-badge>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="d-none"
      @change="onFile"
    />
  </div>
</template>

<script>
import axios from '../../../lib/services/axios';
import userAvatarComponent from './user.avatar.component.vue';

export default {
  name: 'CoreAvatarUploader',
  components: { userAvatarComponent },
  props: {
    user: { type: Object, required: true },
    size: { type: Number, default: 200 },
    endpoint: { type: String, default: '/users/avatar' },
    field: { type: String, default: 'avatar' },
  },
  emits: ['uploaded', 'error'],
  methods: {
    triggerUpload() {
      this.$refs.fileInput.click();
    },
    async onFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append(this.field, file);
      const api = `${this.config.api.protocol}://${this.config.api.host}:${this.config.api.port}/${this.config.api.base}`;
      try {
        await axios.post(`${api}${this.endpoint}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        this.$emit('uploaded');
      } catch (err) {
        this.$emit('error', err);
      } finally {
        event.target.value = '';
      }
    },
  },
};
</script>
