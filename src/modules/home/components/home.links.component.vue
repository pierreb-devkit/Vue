<template>
  <section
    id="features"
    class="py-12"
    :style="custom && custom.section ? custom.section : null"
    v-if="links.length > 0"
  >
    <v-container>
      <v-row>
        <v-col
          v-for="({ items, title }, i) in links.filter(
            (section) => section.items
          )"
          :key="i"
          cols="12"
          :md="12 / links.filter((section) => section.items).length"
        >
          <v-card
            :flat="config.vuetify.theme.flat"
            :style="custom && custom.section ? custom.section : null"
          >
            <v-card-title
              class="justify-center text--secondary"
              v-text="title"
            ></v-card-title>
            <v-list
              dense
              :style="custom && custom.section ? custom.section : null"
            >
              <v-list-item-group color="primary">
                <v-list-item v-for="(item, i) in items" :key="i">
                  <v-list-item-content>
                    <a :href="item.url">
                      <v-list-item-title class="text-center">
                        <v-icon class="pr-2" small>{{ item.icon }}</v-icon>
                        {{ item.label }}
                      </v-list-item-title>
                    </a>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Export default
 */
export default {
  name: 'homeLinksComponent',
  props: ['links', 'custom'],
};
</script>
