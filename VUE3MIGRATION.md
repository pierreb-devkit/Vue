## Simple replace

- Axios Request `Vue.prototype.axios` to `app.config.globalProperties.axios`
- Text colors `*--text` to `text-`
- Theme colors `text—-*` to `text-*`
- JS Theme colors `config.vuetify.theme.themes[theme]` to `config.vuetify.theme.themes[theme].colors`

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
