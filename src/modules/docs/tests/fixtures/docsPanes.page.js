/**
 * A two-pane guide in the shape DocsPanes renders. Fictional API.
 */
const examples = [
  { lang: 'bash', code: 'curl https://api.example.com/api/items' },
  { lang: 'javascript', code: 'await fetch("https://api.example.com/api/items");' },
  { lang: 'python', code: 'requests.get("https://api.example.com/api/items")' },
];

export default {
  title: 'Items',
  lead: 'Read your items.',
  base: 'https://api.example.com',
  sections: [
    {
      id: 'start',
      nav: 'Start',
      title: 'Start',
      aliases: ['statuses'],
      text: 'Send your key with every call.',
      steps: ['Create a <b>new</b> key.', 'Call `/api/items`.'],
      aside: { examples },
    },
    {
      id: 'list',
      nav: 'List items',
      title: 'List items',
      method: 'GET',
      path: '/api/items',
      list: { title: 'Query', rows: [{ name: 'page', type: 'integer', text: 'From 0. See `perPage`.' }] },
      aside: { examples, answer: [{ lang: 'json', code: '{ "data": [] }' }] },
    },
    {
      id: 'read',
      nav: 'Read one',
      title: 'Read one',
      method: 'GET',
      path: '/api/items/:id',
      list: { title: 'Fields', rows: [{ name: 'id', type: 'string', text: 'Listed in `itemIds`.' }] },
      errors: [{ code: '404', text: 'No such item.' }],
      aside: { examples, answer: [{ lang: 'json', label: '200', code: '{ "data": {} }' }, { lang: 'json', label: '404', code: '{ "error": true }' }] },
    },
  ],
};
