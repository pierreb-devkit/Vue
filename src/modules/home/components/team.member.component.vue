<template>
  <v-col cols="12" sm="12" md="6" lg="4" xl="3">
    <v-card class="mx-auto rounded-xl" :flat="config.vuetify.theme.flat">
      <v-img
        :src="require('@/assets/images/background.jpg')"
        class="text-white"
        height="150"
        cover
        :gradient="theme == 'dark' ? 'to top right, rgba(0,0,0,.3), rgba(0,0,0,.7)' : 'to top right, rgba(255,255,255,.3), rgba(255,255,255,.7)'"
        style="border: 5px solid transparent; border-radius: 25px 25px 0 0"
      >
      </v-img>
      <v-card-actions class="pt-6">
        <v-card-title class="text-capitalize"
          ><h4>{{ item.firstName }} {{ item.lastName }}</h4>
        </v-card-title>
        <span class="pl-4 text-secondary" v-if="item.position && item.position !== ''"> {{ item.position }}</span>
        <v-spacer></v-spacer>
        <v-btn @click="show = !show" v-if="item.bio" icon variant="text">
          <v-icon :icon="show ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></v-icon>
        </v-btn>
      </v-card-actions>
      <v-expand-transition>
        <div v-show="show">
          <v-card-actions class="pt-0 px-4">
            <v-chip class="mr-2" v-for="(role, index) in item.roles" v-bind:index="index" v-bind:key="index">{{ role }}</v-chip>
            <v-spacer></v-spacer>
            <v-btn v-if="item.email" :href="`mailto:${item.email}`" icon>
              <v-icon icon="fa-solid fa-envelope"></v-icon>
            </v-btn>
            <v-btn v-if="item.phone" :href="`tel:${item.phone}`" icon>
              <v-icon icon="fa-solid fa-phone"></v-icon>
            </v-btn>
          </v-card-actions>
          <v-card-text class="pt-0 px-6">
            {{ item.bio }}
          </v-card-text>
        </div>
      </v-expand-transition>
      <userAvatarComponent
        style="position: absolute; top: 50px; left: 50%; margin-left: -60px"
        :user="item"
        :width="'120px'"
        :height="'120px'"
        :radius="'50%'"
        :border="'5px'"
        :color="config.vuetify.theme.themes[theme].colors.surface"
        :size="512"
      />
    </v-card>
  </v-col>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import userAvatarComponent from '../../users/components/user.avatar.component.vue';

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
