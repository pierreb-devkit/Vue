<template>
  <accountOrganizationDetailComponent
    :organization-id="$route.params.organizationId"
    back-route="/admin"
  />
</template>

<script>
import accountOrganizationDetailComponent from '../../organizations/components/organization.detail.component.vue';

export default {
  name: 'AdminOrganizationView',
  components: {
    accountOrganizationDetailComponent,
  },
};
</script>
