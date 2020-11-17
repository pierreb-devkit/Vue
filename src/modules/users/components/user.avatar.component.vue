<!--
 Example:
 <userAvatarComponent
 :user="user"
 :width="'200px'"
 :height="'200px'"
 :radius="'50%'"
 :border="'0px'"
 :color="'#000'"
 :size="256"
 />
-->
<template>
  <v-tooltip right>
    <template v-slot:activator="{ on }">
      <div
        :style="{
          width: width,
          height: height,
        }"
      >
        <a v-if="user.id" :href="disabled === true ? null : `/users/${user.id}`">
          <v-img
            v-if="user.avatar && user.avatar != ''"
            v-on="on"
            :src="setImages(config.api, user.avatar, size ? size : 128, null)"
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
            :size="size ? size : 128"
            :style="{
              'margin-top': '7px',
              width: width,
              height: height,
              'border-radius': radius,
              border: border + ' solid ' + color,
            }"
          />
        </a>
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
  name: 'userAvatarComponent',
  props: ['user', 'width', 'height', 'radius', 'border', 'color', 'size', 'disabled'],
};
</script>
