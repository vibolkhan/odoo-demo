import { createApp } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import App from './App.vue'
import router from './router';
import { pinia } from './stores';
import { useAuthStore } from './stores/auth.store';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.class.css';

/* Theme variables */
import './theme/variables.css';

const isAndroidNative = Capacitor.getPlatform() === 'android';

if (isAndroidNative && Capacitor.isPluginAvailable('Keyboard')) {
  window.addEventListener('focusin', (event) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      window.setTimeout(() => {
        void Keyboard.show().catch(() => {
          // Ignore failures so focus still works on fields that do not need manual keyboard control.
        });
      }, 50);
    }
  });
}

const app = createApp(App)
  .use(IonicVue)
  .use(pinia)
  .use(router);

router.isReady().then(async () => {
  const authStore = useAuthStore(pinia);
  await authStore.hydrateSession();
  app.mount('#app');
});
