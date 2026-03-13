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
  <div
    :style="{
      width,
      height,
    }"
  >
    <v-tooltip activator="parent" anchor="left">
      <span v-if="user && user.firstname">{{ user.firstName }}</span>
      <span v-if="user && user.lastName">{{ user.lastName }}</span>
      <br v-if="user && (user.firstname || user.lastName) && user.email" />
      <span v-if="user && user.email">{{ user.email }}</span>
    </v-tooltip>
    <!-- eslint-disable-next-line -->
    <a v-if="user && user.id" :href="disabled === true ? null : `/users/${user.id}`">
      <v-img
        v-if="user.avatar && user.avatar !== ''"
        :src="setImages(config.api, user.avatar, size ? size : 128, null)"
        :style="{
          width,
          height,
          'border-radius': radius,
          border: `${border}px solid ${color}`,
        }"
      ></v-img>
      <v-gravatar
        v-if="!user.avatar || (user.avatar === '' && user.avatar)"
        :email="user.email"
        default-img="mp"
        :size="size ? size : 128"
        :style="{
          width,
          height,
          'border-radius': radius,
          border: `${border}px solid ${color}`,
        }"
      />
    </a>
  </div>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'UserAvatarComponent',
  props: {
    user: {
      type: Object,
      required: true,
    },
    width: {
      type: String,
      default: '50px',
    },
    height: {
      type: String,
      default: '50px',
    },
    radius: {
      type: String,
      default: '50%',
    },
    border: {
      type: String,
      default: '0px',
    },
    color: {
      type: String,
      default: '#000',
    },
    size: {
      type: Number,
      default: 128,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
