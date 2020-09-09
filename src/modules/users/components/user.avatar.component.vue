<!--
 Example:
 <userArrayComponent
 :user="user"
 :width="'200px'"
 :height="'200px'"
 :radius="'50%'"
 :border="'0px'"
 :color="'#000'"
 />
-->
<template>
  <v-tooltip right>
    <template v-slot:activator="{ on }">
      <div>
        <v-img
          v-if="user.avatar && user.avatar != ''"
          v-on="on"
          :src="setImages(config.api, user.avatar, '256', null)"
          :style="{
            width: width,
            height: height,
            'border-radius': radius,
            border: border + 'px solid ' + color,
          }"
        ></v-img>
        <v-gravatar
          v-if="!user.avatar || (user.avatar == '' && user.avatar)"
          v-on="on"
          :email="user.email"
          default-img="mp"
          :style="{
            'margin-top': '7px',
            width: width,
            height: height,
            'border-radius': radius,
            border: border + ' solid ' + color,
          }"
        />
      </div>
    </template>
    <span v-if="user.firstname || user.lastName">{{ user.firstName }} {{ user.lastName }}</span>
    <br v-if="(user.firstname || user.lastName) && user.email" />
    <span v-if="user.email">{{ user.email }}</span>
  </v-tooltip>
</template>

<script>
/**
 * Export default
 */
export default {
  name: 'userArrayComponent',
  props: ['user', 'width', 'height', 'radius', 'border', 'color'],
};
</script>
