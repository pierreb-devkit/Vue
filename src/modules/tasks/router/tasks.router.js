/**
 * Module dependencies.
 */
import tasks from '../views/tasks.view.vue';
import task from '../views/task.view.vue';

/**
 * Router configuration
 */
export default [
  {
    path: '/tasks',
    name: 'Tasks',
    component: tasks,
    meta: {
      icon: 'fa-solid fa-list-check',
    },
  },
  {
    path: '/task',
    name: 'task create',
    component: task,
    meta: {
      display: false, // hide from drawer any time
      roles: ['user'], // proteced, require one of this roles
    },
  },
  {
    path: '/tasks/:id',
    name: 'task',
    component: task,
    meta: {
      display: false, // hide from drawer any time
      roles: ['user'], // proteced, require one of this roles
    },
  },
];
