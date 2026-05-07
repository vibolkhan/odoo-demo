import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AppEmptyState from './AppEmptyState.vue';

// Mock Ionic components
vi.mock('@ionic/vue', () => ({
  IonIcon: { template: '<span></span>' },
}));

describe('AppEmptyState.vue', () => {
  it('renders title and description correctly', () => {
    const wrapper = mount(AppEmptyState, {
      props: {
        title: 'No Data',
        description: 'Try searching again'
      }
    });
    expect(wrapper.text()).toContain('No Data');
    expect(wrapper.text()).toContain('Try searching again');
  });

  it('applies the correct variant class to the icon orb', () => {
    const wrapper = mount(AppEmptyState, {
      props: {
        title: 'Empty',
        variant: 'emerald'
      }
    });
    expect(wrapper.find('.icon-orb').classes()).toContain('emerald');
  });
});
