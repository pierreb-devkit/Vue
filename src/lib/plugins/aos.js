/**
 * Module dependencies.
 */
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * Plugin setup.
 */
export default {
  install: () => {
    AOS.init();
  },
};
