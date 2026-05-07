import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AppAsyncState from './AppAsyncState.vue';

// Mock Ionic components
vi.mock('@ionic/vue', () => ({
  IonButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  IonIcon: { template: '<span></span>' },
  IonSpinner: { template: '<div class="spinner"></div>' },
}));

describe('AppAsyncState.vue', () => {
  it('renders default slot when state is success', () => {
    const wrapper = mount(AppAsyncState, {
      props: {
        state: { status: 'success' }
      },
      slots: {
        default: '<div class="content">Success Content</div>'
      }
    });
    expect(wrapper.find('.content').exists()).toBe(true);
  });

  it('renders loading slot when state is loading', () => {
    const wrapper = mount(AppAsyncState, {
      props: {
        state: { status: 'loading' }
      },
      slots: {
        loading: '<div class="loading">Loading...</div>'
      }
    });
    expect(wrapper.find('.loading').exists()).toBe(true);
  });

  it('renders error state when status is error', () => {
    const wrapper = mount(AppAsyncState, {
      props: {
        state: { status: 'error', error: 'Something went wrong' },
        retry: true
      }
    });
    expect(wrapper.text()).toContain('Something went wrong');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('emits retry event when retry button is clicked', async () => {
    const wrapper = mount(AppAsyncState, {
      props: {
        state: { status: 'error', error: 'Error' },
        retry: true
      }
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted()).toHaveProperty('retry');
  });
});
