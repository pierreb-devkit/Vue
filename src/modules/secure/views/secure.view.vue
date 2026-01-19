<template>
  <v-container fluid>
    <v-row class="ma-2" align="start" justify="center">
      <v-card class="pa-6" width="100%" :style="{ background: theme.current.colors.surface }" :flat="config.vuetify.theme.flat">
        <h2 class="text-center">This page is protected by auth</h2>
      </v-card>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
/**
 * Component definition.
 */
export default {
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
  },
};
</script>
