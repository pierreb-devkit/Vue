## Simple replace

- Axios Request `Vue.prototype.axios` to `app.config.globalProperties.axios`
- Text colors `*--text` to `text-`
- Theme colors `text—-*` to `text-*`
- JS Theme colors `config.vuetify.theme.themes[theme]` to `config.vuetify.theme.themes[theme].colors`
- Font awesome icons become `fa-node-js` to `fa-brands fa-node-js`

## Configuration

We have switched to `cjs` configuration files.

- rename your configuration file to `.cjs`
- replace defaultconfig import to new `.cjs` file, `const defaultConfig = require('./development.cjs');`

Nothing else change except vuetify configuration, it's an adaptation to vuetify 3.

- They add colors in the themes objects

```
        light: {
            primary: '#2c3e50',
            secondary: '#ff4757',
        },
```

to

```
        light: {
          colors: {
            primary: '#2c3e50',
            secondary: '#ff4757',
          },
        },
```

- To simplify,

```
      navigation: {
        displayIfLogged: true, // show nav only if user is logged (easy for one page site)
      },
```

become

```
      navigation: {
        ifLogged: true, // show nav only if user is logged (easy for one page site)
      },
```

The default value is set to true.

## Code update

### Store updates

You need to edit every store in modules.

- To avoid somme errors, all states must become a return function

```
const state = {
  task: {
    title: '',
    description: '',
  },
  tasks: [],
};
```

to

```
const state = () => ({
  task: {
    title: '',
    description: '',
  },
  tasks: [],
});
```

- we will also udpate the actions with app const

`const actions = { }` to `const actions = (app) => { }`

- and of course, this two actions will update the export

```
export default {
  state,
  getters,
  actions,
  mutations,
};
```

to

```
export default (app) => {
  return {
    state,
    getters,
    actions: actions(app),
    mutations,
  };
};
```

### Async form validation

The form validation return became async/await so you need to update every validaiton in your modules: `this.$refs.form.validate()`.

```
    create() {
      if (this.$refs.form.validate()) {
        this.$store
          .dispatch('createTask', this.task)
          .then(() => {
            this.$router.push(`/tasks/${this.task.id}`);
            this.save = false;
          })
          .catch((err) => console.log(err));
      }
    },
```

to

```
    async create() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        this.$store
          .dispatch('createTask', this.task)
          .then(() => {
            this.$router.push(`/tasks/${this.task.id}`);
            this.save = false;
          })
          .catch((err) => console.log(err));
      }
    },
```
