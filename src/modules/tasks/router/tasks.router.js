/**
 * Module dependencies.
 */
import tasks from '../views/tasks.view.vue';
import task from '../views/task.view.vue';

/**
 * Router configuration.
 */
export default [
  {
    path: '/tasks',
    name: 'Tasks',
    component: tasks,
    meta: {
      icon: 'fa-solid fa-list-check',
      order: 20, // sidenav sort order (lower = first)
      action: 'read', subject: 'Task',
    },
  },
  {
    path: '/task',
    name: 'task create',
    component: task,
    meta: {
      display: false, // hide from drawer any time
      action: 'create', subject: 'Task', // protected, require ability
    },
  },
  {
    path: '/tasks/:id',
    name: 'task',
    component: task,
    meta: {
      display: false, // hide from drawer any time
      action: 'read', subject: 'Task', // protected, require ability
    },
  },
];

/**
 * Exports.
 */
