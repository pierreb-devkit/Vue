import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTasksStore } from '../stores/tasks.store';

describe('Tasks Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const tasksStore = useTasksStore();
    expect(tasksStore.tasks).toEqual([]);
    expect(tasksStore.task).toEqual({
      title: '',
      description: '',
    });
  });

  it('should reset task to default values', () => {
    const tasksStore = useTasksStore();

    // Modify task
    tasksStore.task.title = 'Test Task';
    tasksStore.task.description = 'Test Description';

    expect(tasksStore.task.title).toBe('Test Task');
    expect(tasksStore.task.description).toBe('Test Description');

    // Reset
    tasksStore.resetTask();

    expect(tasksStore.task).toEqual({
      title: '',
      description: '',
    });
  });

  it('should allow updating task properties', () => {
    const tasksStore = useTasksStore();

    tasksStore.task.title = 'New Task';
    tasksStore.task.description = 'New Description';

    expect(tasksStore.task.title).toBe('New Task');
    expect(tasksStore.task.description).toBe('New Description');
  });

  it('should maintain tasks array', () => {
    const tasksStore = useTasksStore();
    const mockTasks = [
      { id: '1', title: 'Task 1', description: 'Description 1' },
      { id: '2', title: 'Task 2', description: 'Description 2' },
    ];

    tasksStore.tasks = mockTasks;

    expect(tasksStore.tasks).toEqual(mockTasks);
    expect(tasksStore.tasks.length).toBe(2);
  });
});
