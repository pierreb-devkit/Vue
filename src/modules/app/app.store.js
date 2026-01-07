/**
 * Module dependencies.
 */
import { useCoreStore } from '../core/stores/core.store';
import { useAuthStore } from '../auth/stores/auth.store';
import { useHomeStore } from '../home/stores/home.store';

/**
 * Initialize specific stores that need runtime data.
 */
const initializeStores = (routes) => {
  // Initialize stores that need runtime data
  const coreStore = useCoreStore();
  const authStore = useAuthStore();
  const homeStore = useHomeStore();

  // Initialize with runtime data only
  coreStore.init(routes);
  authStore.initFromStorage();
  homeStore.initStatistics();

  return {
    core: coreStore,
    auth: authStore,
    home: homeStore,
  };
};

export default initializeStores;
