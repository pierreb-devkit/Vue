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

    it('should handle getTasks error', async () => {
      const tasksStore = useTasksStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await tasksStore.getTasks();

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
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

    it('should handle getTask error', async () => {
      const tasksStore = useTasksStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await tasksStore.getTask({ id: '123' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
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

    it('should handle createTask error', async () => {
      const tasksStore = useTasksStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Failed'));

      await tasksStore.createTask({ title: 'Test' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
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

    it('should handle updateTask error', async () => {
      const tasksStore = useTasksStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.put.mockRejectedValueOnce(new Error('Failed'));

      await tasksStore.updateTask({ id: '789' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
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

    it('should handle deleteTask error', async () => {
      const tasksStore = useTasksStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.delete.mockRejectedValueOnce(new Error('Failed'));

      await tasksStore.deleteTask({ id: '999' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });
});
