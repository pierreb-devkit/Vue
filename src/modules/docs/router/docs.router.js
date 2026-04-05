/**
 * Module dependencies.
 */
import docsLayout from '../views/docs.layout.view.vue';
import docs from '../views/docs.view.vue';
import docsGuides from '../views/docs.guides.view.vue';
import docsGuide from '../views/docs.guide.view.vue';

/**
 * Router configuration.
 */
export default [
  {
    path: '/docs',
    component: docsLayout,
    meta: {
      display: false,
    },
    children: [
      {
        path: '',
        name: 'Docs',
        component: docs,
        meta: {
          display: false,
          title: 'API Docs',
        },
      },
      {
        path: 'guides',
        name: 'DocsGuides',
        component: docsGuides,
        meta: {
          display: false,
          title: 'Guides',
        },
      },
      {
        path: 'guides/:slug',
        name: 'DocsGuide',
        component: docsGuide,
        meta: {
          display: false,
          title: 'Guide',
        },
      },
    ],
  },
];
