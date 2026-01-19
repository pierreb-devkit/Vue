<!--
  TeamMemberComponent
  ===================
  Team member card with avatar, name, position, roles, and contact info.

  USAGE:
  <teamMemberComponent
    v-for="(item, index) in team"
    :key="item.id"
    :item="item"
    :index="index"
  />

  PROPS:
  - item (Object): Team member data object
  - index (Number): Index in the list

  ITEM OBJECT FORMAT:
  {
    id: 'user-id',
    firstName: 'John',
    lastName: 'Doe',
    position: 'Developer',          // Optional: Job title
    roles: ['admin', 'developer'],  // Optional: Role chips
    email: 'john@example.com',      // Optional: Email link
    phone: '+1234567890',           // Optional: Phone link
    bio: 'Short biography...',      // Optional: Expandable bio text
    avatar: '/images/avatar.webp',  // Optional: Avatar image (uses userAvatarComponent)
  }

  NOTES:
  - Data is fetched via homeStore.getTeam() in home.team.view.vue
  - Expandable card shows bio, roles, and contact buttons
  - Avatar uses userAvatarComponent with 120px size
-->
<template>
  <v-col sm="12" md="6" lg="4" xl="4">
    <v-card :class="`mx-auto ${config.vuetify.theme.rounded}`" :flat="config.vuetify.theme.flat">
      <v-img
        src="/images/dark.webp"
        class="`text-white ${config.vuetify.theme.rounded}`"
        height="150"
        cover
        :gradient="themeName === 'dark' ? 'to top right, rgba(0,0,0,.3), rgba(0,0,0,.7)' : 'to top right, rgba(255,255,255,.3), rgba(255,255,255,.7)'"
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
        :color="theme.current.colors.surface"
        :size="512"
      />
    </v-card>
  </v-col>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import userAvatarComponent from '../../users/components/user.avatar.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'TeamMemberComponent',
  components: {
    userAvatarComponent,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      show: false,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
  },
};
</script>
