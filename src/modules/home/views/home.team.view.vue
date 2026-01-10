<template>
  <div>
    <homeBannerComponent :ratio="3" :title="$route.meta.title" :subtitle="null"></homeBannerComponent>
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
import { useCoreStore } from '../../core/stores/core.store';
import { useHomeStore } from '../stores/home.store';
import teamMemberComponent from '../components/team.member.component.vue';
import homeBannerComponent from '../components/home.banner.component.vue';

/**
 * Component definition.
 */
export default {
  components: {
    homeBannerComponent,
    teamMemberComponent,
  },
  computed: {
    theme() {
      const coreStore = useCoreStore();
      return coreStore.theme;
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
