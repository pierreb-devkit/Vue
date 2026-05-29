import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTasksStore } from '../stores/tasks.store';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: {
      protocol: 'http',
      host: 'localhost',
      port: '3000',
      base: 'api',
      endPoints: { tasks: 'tasks' },
    },
  },
}));

describe('Tasks Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
    vi.clearAllMocks();
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

  describe('getTasks', () => {
    it('should fetch and set tasks', async () => {
      const tasksStore = useTasksStore();
      const mockTasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockTasks } });

      await tasksStore.getTasks();

      expect(tasksStore.tasks).toEqual(mockTasks);
    });

    it('should propagate getTasks error to caller', async () => {
      const tasksStore = useTasksStore();
      const error = new Error('Network error');

      axios.get.mockRejectedValueOnce(error);

      await expect(tasksStore.getTasks()).rejects.toThrow('Network error');
    });
  });

  describe('getTask', () => {
    it('should fetch and set single task', async () => {
      const tasksStore = useTasksStore();
      const mockTask = { id: '123', title: 'Test Task', description: 'Test' };

      axios.get.mockResolvedValueOnce({ data: { data: mockTask } });

      await tasksStore.getTask({ id: '123' });

      expect(tasksStore.task).toEqual(mockTask);
    });

    it('should propagate getTask error to caller', async () => {
      const tasksStore = useTasksStore();
      const error = new Error('Not found');

      axios.get.mockRejectedValueOnce(error);

      await expect(tasksStore.getTask({ id: '123' })).rejects.toThrow('Not found');
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const tasksStore = useTasksStore();
      const newTask = { title: 'New Task', description: 'New Description' };
      const mockResponse = { data: { data: { id: '456', ...newTask } } };

      axios.post.mockResolvedValueOnce(mockResponse);

      await tasksStore.createTask(newTask);

      expect(tasksStore.task).toEqual(mockResponse.data.data);
    });

    it('should propagate createTask error to caller', async () => {
      const tasksStore = useTasksStore();
      const error = new Error('Server error');

      axios.post.mockRejectedValueOnce(error);

      await expect(tasksStore.createTask({ title: 'Test' })).rejects.toThrow('Server error');
    });

    it('should not update store state when createTask fails', async () => {
      const tasksStore = useTasksStore();
      const originalTask = { ...tasksStore.task };

      axios.post.mockRejectedValueOnce(new Error('Failed'));

      await expect(tasksStore.createTask({ title: 'Test' })).rejects.toThrow();
      expect(tasksStore.task).toEqual(originalTask);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const tasksStore = useTasksStore();
      tasksStore.task = { id: '789', title: 'Old', description: 'Old desc' };
      const updatedTask = { id: '789', title: 'Updated', description: 'Updated desc' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedTask } });

      await tasksStore.updateTask({ id: '789' });

      expect(tasksStore.task).toMatchObject(updatedTask);
    });

    it('should propagate updateTask error to caller', async () => {
      const tasksStore = useTasksStore();
      const error = new Error('Update failed');

      axios.put.mockRejectedValueOnce(error);

      await expect(tasksStore.updateTask({ id: '789' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task and reset', async () => {
      const tasksStore = useTasksStore();
      tasksStore.task = { id: '999', title: 'To Delete', description: 'Delete me' };

      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      await tasksStore.deleteTask({ id: '999' });

      expect(tasksStore.task).toEqual({ title: '', description: '' });
    });

    it('should propagate deleteTask error to caller', async () => {
      const tasksStore = useTasksStore();
      const error = new Error('Delete failed');

      axios.delete.mockRejectedValueOnce(error);

      await expect(tasksStore.deleteTask({ id: '999' })).rejects.toThrow('Delete failed');
    });

    it('should not reset task state when deleteTask fails', async () => {
      const tasksStore = useTasksStore();
      tasksStore.task = { id: '999', title: 'To Delete', description: 'Delete me' };

      axios.delete.mockRejectedValueOnce(new Error('Failed'));

      await expect(tasksStore.deleteTask({ id: '999' })).rejects.toThrow();
      // Task should NOT have been reset since the delete failed
      expect(tasksStore.task).toMatchObject({ id: '999', title: 'To Delete' });
    });
  });
});
