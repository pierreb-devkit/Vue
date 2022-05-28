<template>
  <div>
    <homeBannerComponent v-bind:ratio="3" v-bind:app="{ subtitle: this.$route.meta.title }"></homeBannerComponent>
    <v-container fluid>
      <v-layout wrap align-content-space-around text-xs-center>
        <teamMemberComponent v-for="(item, index) in team" v-bind:item="item" v-bind:index="index" v-bind:key="item.id"></teamMemberComponent>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import teamMemberComponent from '../components/team.member.component.vue';
import homeBannerComponent from '../components/home.banner.component.vue';

/**
 * Export default
 */
export default {
  data() {
    return {
      valid: true, // TODO: switch to false when forms will be reactive
      password: 'Password',
      rules: {
        email: (v) => /\S+@\S+\.\S+/.test(v) || '',
      },
    };
  },
  components: {
    homeBannerComponent,
    teamMemberComponent,
  },
  computed: {
    ...mapGetters(['theme', 'team']),
  },
  created() {
    this.$store.dispatch('getTeam');
  },
  methods: {
    generateTemporalBackground() {
      return `${this.config.home.temporalBackground}/${`0${new Date().getHours()}`.slice(-2)}.jpg`;
    },
  },
};
</script>
