import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminWeeklyBars from '../components/admin.weeklyBars.component.vue';

const weeks = (counts) => counts.map((count, i) => ({ week: new Date(Date.UTC(2026, 8, 7 + i * 7)).toISOString().slice(0, 10), count }));

describe('admin.weeklyBars.component', () => {
  it('should draw one column per week and a bar only for non-zero weeks', () => {
    const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([0, 3, 1]), label: 'New accounts' } });
    expect(wrapper.findAll('.admin-weekly-bars__col')).toHaveLength(3);
    expect(wrapper.findAll('.admin-weekly-bars__bar')).toHaveLength(2);
  });

  it('should use a round scale strictly above the maximum', () => {
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([1, 2]), label: 'x' } }).vm.scaleMax).toBe(4);
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([5]), label: 'x' } }).vm.scaleMax).toBe(6);
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([7]), label: 'x' } }).vm.scaleMax).toBe(8);
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([14]), label: 'x' } }).vm.scaleMax).toBe(16);
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([260]), label: 'x' } }).vm.scaleMax).toBe(300);
    expect(mount(AdminWeeklyBars, { props: { weeks: weeks([1000]), label: 'x' } }).vm.scaleMax).toBe(1200);
  });

  it('should only print integer ticks', () => {
    for (const max of [0, 3, 5, 9, 14, 37, 99, 260, 1234]) {
      const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([max]), label: 'x' } });
      expect(wrapper.vm.ticks.every(Number.isInteger)).toBe(true);
      expect(wrapper.vm.scaleMax).toBeGreaterThan(max);
    }
  });

  it('should label the first, middle and last weeks', () => {
    const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([1, 1, 1, 1, 1]), label: 'x' } });
    const labels = wrapper.findAll('.admin-weekly-bars__axis span').map((s) => s.text());
    expect(labels).toEqual(['Sep 7', '', 'Sep 21', '', 'Oct 5']);
  });

  it('should describe the series for screen readers', () => {
    const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([2, 3]), label: 'New accounts' } });
    expect(wrapper.find('figure').attributes('aria-label')).toBe('New accounts: 5 over 2 weeks, from the week of Sep 7');
  });

  it('should list each week and its count as text outside the chart', () => {
    const wrapper = mount(AdminWeeklyBars, { props: { weeks: weeks([2, 3]), label: 'New accounts' } });
    const items = wrapper.findAll('.admin-weekly-bars__sr li').map((li) => li.text());
    expect(items).toEqual(['Week of Sep 7: 2', 'Week of Sep 14: 3']);
    expect(wrapper.find('figure').find('.admin-weekly-bars__sr').exists()).toBe(false);
  });
});
