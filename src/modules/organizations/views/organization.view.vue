<template>
  <organizationDetailComponent
    ref="detail"
    :organization-id="$route.params.organizationId"
    back-route="/users"
  />
</template>

<script>
import organizationDetailComponent from '../components/organization.detail.component.vue';

export default {
  name: 'OrganizationView',
  components: {
    organizationDetailComponent,
  },
  /**
   * @desc Guard against navigating away with unsaved changes.
   * @param {Object} to - Target route
   * @param {Object} from - Current route
   * @param {Function} next - Navigation resolver
   * @returns {void}
   */
  beforeRouteLeave(to, from, next) {
    const detailComponent = this.$refs.detail;
    if (detailComponent && detailComponent.dirty) {
      const answer = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!answer) return next(false);
    }
    next();
  },
};
</script>
