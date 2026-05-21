import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

vi.mock('../../../lib/services/axios', () => ({
  default: { post: vi.fn().mockResolvedValue({ data: { ok: true } }) },
}));

import coreAvatarUploader from '../components/core.avatarUploader.component.vue';
import axios from '../../../lib/services/axios';

const vuetify = createVuetify({ components, directives });

const baseGlobal = {
  plugins: [vuetify],
  mocks: { config: { api: { protocol: 'http', host: 'localhost', port: 3000, base: 'api/v1' } } },
  stubs: { userAvatarComponent: { template: '<div class="stub-avatar"></div>' } },
};

describe('core.avatarUploader.component', () => {
  it('renders the avatar and a camera trigger', () => {
    const wrapper = mount(coreAvatarUploader, {
      global: baseGlobal,
      props: { user: { firstName: 'Jane' }, size: 200, endpoint: '/users/avatar' },
    });
    expect(wrapper.find('.stub-avatar').exists()).toBe(true);
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('emits uploaded after a successful POST', async () => {
    axios.post.mockClear();
    const wrapper = mount(coreAvatarUploader, {
      global: baseGlobal,
      props: { user: { firstName: 'Jane' }, endpoint: '/users/avatar' },
    });
    const input = wrapper.find('input[type="file"]');
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await flushPromises();
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toContain('/users/avatar');
    expect(wrapper.emitted('uploaded')).toBeTruthy();
  });
});
