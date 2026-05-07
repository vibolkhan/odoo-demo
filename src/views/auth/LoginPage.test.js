import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginPage from './LoginPage.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
  })),
  useRoute: vi.fn(() => ({
    query: {},
  })),
}));

// Mock Ionic components
vi.mock('@ionic/vue', async () => {
  return {
    IonPage: { template: '<div><slot /></div>' },
    IonContent: { template: '<div><slot /></div>' },
    IonButton: { template: '<button><slot /></button>' },
    IonIcon: { template: '<span></span>' },
  };
});

describe('LoginPage.vue', () => {
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [pinia]
      }
    });
    expect(wrapper.find('h1').text()).toBe('Welcome Back');
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
  });

  it('toggles password visibility', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [pinia]
      }
    });
    const passwordInput = wrapper.find('input[placeholder="Password"]');
    const toggleButton = wrapper.find('.password-toggle');

    expect(passwordInput.attributes('type')).toBe('password');
    
    await toggleButton.trigger('click');
    expect(passwordInput.attributes('type')).toBe('text');

    await toggleButton.trigger('click');
    expect(passwordInput.attributes('type')).toBe('password');
  });

  it('shows error message if fields are empty', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [pinia]
      }
    });
    
    // Clear fields (they have defaults)
    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[placeholder="Password"]');
    
    // We need to set them to empty strings
    // In Vue Test Utils, we use setValue for v-model
    await emailInput.setValue('');
    await passwordInput.setValue('');
    
    await wrapper.find('form').trigger('submit.prevent');
    
    expect(wrapper.find('.error-message').text()).toContain('Please enter both email and password');
  });
});
