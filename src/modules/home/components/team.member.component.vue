<template>
  <v-col cols="12" sm="6" md="6" lg="4" xl="3">
    <v-card class="mx-auto" :style="{ background: config.vuetify.theme.themes[theme].surface }" :flat="config.vuetify.theme.flat">
      <v-img
        :src="require('@/assets/images/background.jpg')"
        height="175"
        class="pt-2"
        :gradient="theme == 'dark' ? 'to top right, rgba(0,0,0,.3), rgba(0,0,0,.7)' : 'to top right, rgba(255,255,255,.3), rgba(255,255,255,.7)'"
      >
        <center>
          <userAvatarComponent
            :user="item"
            :width="'150px'"
            :height="'150px'"
            :radius="'50%'"
            :border="'5px'"
            :color="config.vuetify.theme.themes[theme].surface"
            :size="512"
          />
        </center>
      </v-img>
      <v-card-actions>
        {{ item.firstName }} {{ item.lastName }}
        <span class="pl-4 secondary--text" v-if="item.position && item.position !== ''"> {{ item.position }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="show = !show">
          <v-icon>{{ show ? 'fa-chevron-up' : 'fa-chevron-down' }}</v-icon>
        </v-btn>
      </v-card-actions>
      <v-expand-transition>
        <div v-show="show">
          <v-divider></v-divider>
          <v-card-text>{{ item.bio }}</v-card-text>
        </div>
      </v-expand-transition>
    </v-card>
  </v-col>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import userAvatarComponent from '@/modules/users/components/user.avatar.component.vue';

/**
 * Export default
 */
export default {
  name: 'taskComponent',
  data: () => ({
    show: false,
  }),
  props: ['item'],
  components: {
    userAvatarComponent,
  },
  computed: {
    ...mapGetters(['isLoggedIn', 'theme']),
  },
};
</script>
