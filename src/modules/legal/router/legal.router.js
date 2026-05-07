import config from '@/config';
import legalPage from '../views/legal.page.view.vue';

const enabled = Boolean(config?.legal?.pages?.enabled);
const prefix = config?.legal?.pages?.routePrefix || '/legal';

const routes = enabled
  ? [
      {
        path: `${prefix}/:slug`,
        name: 'LegalPage',
        component: legalPage,
        meta: { display: false, footer: true },
      },
    ]
  : [];

export default routes;
