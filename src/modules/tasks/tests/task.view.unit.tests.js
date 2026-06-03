import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

/**
 * Hoisted mocks — must be defined before any imports that transitively use them.
 */
const createTaskMock = vi.hoisted(() => vi.fn());
const updateTaskMock = vi.hoisted(() => vi.fn());
const deleteTaskMock = vi.hoisted(() => vi.fn());
const getTaskMock = vi.hoisted(() => vi.fn());

const mockTask = vi.hoisted(() => ({
  title: 'My Task',
  description: 'My Description',
  id: null,
}));

vi.mock('../stores/tasks.store', () => ({
  useTasksStore: () => ({
    get task() {
      return mockTask;
    },
    createTask: createTaskMock,
    updateTask: updateTaskMock,
    deleteTask: deleteTaskMock,
    getTask: getTaskMock,
    resetTask: vi.fn(),
  }),
}));

vi.mock('../../core/components/core.pageHeader.component.vue', () => ({
  default: { template: '<div><slot name="actions" /></div>' },
}));

vi.mock('../components/task.component.vue', () => ({
  default: { template: '<div />' },
}));

import TaskView from '../views/task.view.vue';

const mockPush = vi.fn();

/**
 * Mount the task view with optional route params.
 * @param {Object} [options]
 * @param {string|null} [options.id=null] - Route param id
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mockConfig = {
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
};

const mountView = ({ id = null } = {}) =>
  mount(TaskView, {
    global: {
      plugins: [createVuetify(), createPinia()],
      mocks: {
        config: mockConfig,
        $route: { params: { id } },
        $router: { push: mockPush },
      },
      stubs: { RouterLink: true },
    },
  });

describe('task.view — create()', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockTask.id = null;
    mockTask.title = 'My Task';
    mockTask.description = 'My Description';
  });

  it('navigates to /tasks after a successful create', async () => {
    createTaskMock.mockResolvedValueOnce({ id: 'new-id', title: 'My Task', description: 'My Description' });

    const wrapper = mountView();
    await flushPromises();

    await wrapper.vm.create();

    expect(createTaskMock).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/tasks');
    expect(wrapper.vm.save).toBe(false);
  });

  it('does NOT navigate when createTask rejects', async () => {
    createTaskMock.mockRejectedValueOnce(new Error('Server error'));

    const wrapper = mountView();
    await flushPromises();

    await wrapper.vm.create();

    expect(createTaskMock).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does NOT clear save flag when createTask rejects', async () => {
    createTaskMock.mockRejectedValueOnce(new Error('Server error'));

    const wrapper = mountView();
    await flushPromises();

    wrapper.vm.save = true;
    await wrapper.vm.create();

    // save should remain true (not cleared to false) on failure
    expect(wrapper.vm.save).toBe(true);
  });
});

describe('task.view — update()', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockTask.id = 'task-123';
    mockTask.title = 'My Task';
    mockTask.description = 'My Description';
    getTaskMock.mockResolvedValue({ id: 'task-123', title: 'My Task', description: 'My Description' });
  });

  it('navigates to /tasks after a successful update', async () => {
    updateTaskMock.mockResolvedValueOnce({ id: 'task-123', title: 'My Task', description: 'My Description' });

    const wrapper = mountView({ id: 'task-123' });
    await flushPromises();

    await wrapper.vm.update();

    expect(updateTaskMock).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/tasks');
    expect(wrapper.vm.save).toBe(false);
  });

  it('does NOT navigate when updateTask rejects', async () => {
    updateTaskMock.mockRejectedValueOnce(new Error('Update failed'));

    const wrapper = mountView({ id: 'task-123' });
    await flushPromises();

    await wrapper.vm.update();

    expect(updateTaskMock).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does NOT clear save flag when updateTask rejects', async () => {
    updateTaskMock.mockRejectedValueOnce(new Error('Update failed'));

    const wrapper = mountView({ id: 'task-123' });
    await flushPromises();

    wrapper.vm.save = true;
    await wrapper.vm.update();

    expect(wrapper.vm.save).toBe(true);
  });
});

describe('task.view — remove()', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockTask.id = 'task-123';
    mockTask.title = 'My Task';
    mockTask.description = 'My Description';
    getTaskMock.mockResolvedValue({ id: 'task-123', title: 'My Task', description: 'My Description' });
  });

  it('navigates to /tasks after a successful delete', async () => {
    deleteTaskMock.mockResolvedValueOnce(undefined);

    const wrapper = mountView({ id: 'task-123' });
    await flushPromises();

    await wrapper.vm.remove();

    expect(deleteTaskMock).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/tasks');
  });

  it('does NOT navigate when deleteTask rejects', async () => {
    deleteTaskMock.mockRejectedValueOnce(new Error('Delete failed'));

    const wrapper = mountView({ id: 'task-123' });
    await flushPromises();

    await wrapper.vm.remove();

    expect(deleteTaskMock).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('task.view — save flag on user action (T6)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockTask.id = null;
    mockTask.title = 'My Task';
    mockTask.description = 'My Description';
  });

  it('sets save=true when title computed setter is called', async () => {
    const wrapper = mountView();
    await flushPromises();

    // Simulate user editing the title
    wrapper.vm.title = 'Updated Title';

    expect(wrapper.vm.save).toBe(true);
  });

  it('sets save=true when description computed setter is called', async () => {
    const wrapper = mountView();
    await flushPromises();

    // Simulate user editing the description
    wrapper.vm.description = 'Updated Description';

    expect(wrapper.vm.save).toBe(true);
  });

  it('does not have a watch block on task (removed in T6)', () => {
    const wrapper = mountView();
    // The $options.watch should be absent or not contain a 'task' watcher
    const watch = wrapper.vm.$options.watch;
    if (watch) {
      expect(watch).not.toHaveProperty('task');
    } else {
      // No watch block at all — task watcher is gone (expected outcome)
      expect(watch).toBeUndefined();
    }
  });

  it('save starts as null (not pre-triggered on mount for new task)', async () => {
    const wrapper = mountView();
    await flushPromises();

    // For a new task (no id), save should remain null until user edits
    expect(wrapper.vm.save).toBeNull();
  });
});
