import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import coreConfirmDialog from '../components/core.confirmDialog.component.vue';

const vuetify = createVuetify({ components, directives });

// v-dialog portals to document.body via VOverlay which requires visualViewport
// (not available in happy-dom). Stub it with a slot-rendering div — all inner
// card content is still rendered and testable through wrapper.
const dialogStub = {
  name: 'v-dialog',
  props: ['modelValue', 'maxWidth'],
  emits: ['update:modelValue'],
  template: '<div class="v-dialog-stub"><slot /></div>',
};

const baseGlobal = {
  plugins: [vuetify],
  mocks: { config: { vuetify: { theme: { rounded: 'rounded-lg' } } } },
  stubs: { 'v-dialog': dialogStub },
};

describe('coreConfirmDialog', () => {
  it('renders title, message and Cancel + Confirm buttons when opened', async () => {
    const wrapper = mount(coreConfirmDialog, {
      global: baseGlobal,
      props: {
        modelValue: true,
        title: 'Delete this user?',
        message: 'This action cannot be undone.',
        confirmLabel: 'Delete',
        confirmColor: 'error',
      },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    const text = document.body.textContent;
    expect(text).toContain('Delete this user?');
    expect(text).toContain('This action cannot be undone.');
    expect(text).toContain('Delete');
    expect(text).toContain('Cancel');
    wrapper.unmount();
  });

  it('keeps the confirm button disabled until typed string matches confirmText', async () => {
    const wrapper = mount(coreConfirmDialog, {
      global: baseGlobal,
      props: {
        modelValue: true,
        title: 'Delete Organization',
        message: 'Type the org name to confirm.',
        confirmText: 'Acme Inc.',
        confirmLabel: 'Delete',
        confirmColor: 'error',
      },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    const confirmBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Delete');
    expect(confirmBtn).toBeTruthy();
    expect(confirmBtn.disabled).toBe(true);
    await wrapper.setData({ typed: 'Acme Inc.' });
    await wrapper.vm.$nextTick();
    expect(confirmBtn.disabled).toBe(false);
    wrapper.unmount();
  });

  it('emits confirm when the confirm button is clicked', async () => {
    const wrapper = mount(coreConfirmDialog, {
      global: baseGlobal,
      props: {
        modelValue: true,
        title: 'Leave Organization',
        message: 'Are you sure?',
        confirmLabel: 'Leave',
        confirmColor: 'error',
      },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    const confirmBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Leave');
    confirmBtn.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    wrapper.unmount();
  });
});
