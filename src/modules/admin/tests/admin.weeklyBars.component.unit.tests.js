import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminWeeklyBars from '../components/admin.weeklyBars.component.vue';

const weeks = (counts) => counts.map((count, i) => ({ week: `2026-09-${String(i * 7 + 7).padStart(2, '0')}`, count }));

describe('admin.weeklyBars.component', () => {
  it('should draw one column per week and a bar only for non-zero weeks', () => {
    const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([0, 3, 1]), label: 'New accounts' } });
    expect(wrapper.findAll('.admin-weekly-bars__col')).toHaveLength(3);
    expect(wrapper.findAll('.admin-weekly-bars__bar')).toHaveLength(2);
  });

  it('should use a round scale at or above the maximum', () => {
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([1, 2]), label: 'x' } }).vm.scaleMax).toBe(4);
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([7]), label: 'x' } }).vm.scaleMax).toBe(10);
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([13]), label: 'x' } }).vm.scaleMax).toBe(20);
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([260]), label: 'x' } }).vm.scaleMax).toBe(500);
  });

  it('should only print integer ticks', () => {
    const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([5]), label: 'x' } });
    expect(wrapper.vm.ticks.every(Number.isInteger)).toBe(true);
  });

  it('should label the first, middle and last weeks', () => {
    const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([1, 1, 1, 1, 1]), label: 'x' } });
    const labels = wrapper.findAll('.admin-weekly-bars__axis span').map((s) => s.text());
    expect(labels.filter(Boolean)).toHaveLength(3);
    expect(labels[0]).toBe('Sep 7');
  });

  it('should describe the series for screen readers', () => {
    const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([2, 3]), label: 'New accounts' } });
    expect(wrapper.attributes('aria-label')).toBe('New accounts: 5 over 2 weeks, from the week of Sep 7');
  });
});
