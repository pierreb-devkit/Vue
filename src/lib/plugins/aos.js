/**
 * Module dependencies.
 */
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * Plugin Setup
 */
export default {
  install: () => {
    AOS.init();
  },
};
