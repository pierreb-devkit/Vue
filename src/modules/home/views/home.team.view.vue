<template>
  <div>
    <homeHeroComponent
      variant="blur"
      :title="$route.meta.title"
      :ratio="3"
      :animation-speed="config.home.hero?.blur?.animationSpeed || 1"
      :background-colors="themeName === 'dark' ? config.home.hero?.blur?.dark?.backgroundColors : config.home.hero?.blur?.light?.backgroundColors"
      :halo-colors="themeName === 'dark' ? config.home.hero?.blur?.dark?.haloColors : config.home.hero?.blur?.light?.haloColors"
    ></homeHeroComponent>
    <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
      <v-layout wrap align-content-space-around text-xs-center>
        <teamMemberComponent v-for="(item, index) in team" :key="item.id" :item="item" :index="index"></teamMemberComponent>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useHomeStore } from '../stores/home.store';
import teamMemberComponent from '../components/team.member.component.vue';
import homeHeroComponent from '../components/home.hero.component.vue';

/**
 * Component definition.
 */
export default {
  components: {
    homeHeroComponent,
    teamMemberComponent,
  },
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    team() {
      const homeStore = useHomeStore();
      return homeStore.team;
    },
  },
  created() {
    const homeStore = useHomeStore();
    homeStore.getTeam(this);
  },
};
</script>
