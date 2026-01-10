<template>
  <v-col sm="12" md="6" lg="4" xl="4">
    <v-card :class="`mx-auto ${config.vuetify.theme.rounded}`" :flat="config.vuetify.theme.flat">
      <v-img
        src="/images/dark.webp"
        class="`text-white ${config.vuetify.theme.rounded}`"
        height="150"
        cover
        :gradient="theme === 'dark' ? 'to top right, rgba(0,0,0,.3), rgba(0,0,0,.7)' : 'to top right, rgba(255,255,255,.3), rgba(255,255,255,.7)'"
        style="border: 5px solid transparent"
      >
      </v-img>
      <v-card-actions class="pt-6">
        <v-card-title class="text-capitalize"
          ><h4>{{ item.firstName }} {{ item.lastName }}</h4>
        </v-card-title>
        <span v-if="item.position && item.position !== ''" class="pl-4 text-secondary"> {{ item.position }}</span>
        <v-spacer></v-spacer>
        <v-btn v-if="item.bio" icon variant="text" @click="show = !show">
          <v-icon :icon="show ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></v-icon>
        </v-btn>
      </v-card-actions>
      <v-expand-transition>
        <div v-show="show">
          <v-card-actions class="pt-0 px-4">
            <v-chip v-for="(role, index) in item.roles" :key="index" class="mr-2" :index="index">{{ role }}</v-chip>
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
import { useCoreStore } from '../../core/stores/core.store';
import userAvatarComponent from '../../users/components/user.avatar.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'TaskComponent',
  components: {
    userAvatarComponent,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    show: false,
  }),
  computed: {
    theme() {
      const coreStore = useCoreStore();
      return coreStore.theme;
    },
  },
};
</script>
