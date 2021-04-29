/**
 * Module dependencies.
 */
import Vue from 'vue';
import AOS from 'aos';
import 'aos/dist/aos.css'; // If ypu need load compiled AOS css here in plugin

class AosPlugin {
  config = {
    // Your AOS config here
  };

  install(vue) {
    AOS.init(this.config);

    vue.mixin({
      updated() {
        this.$nextTick(() => {
          AOS.refreshHard(); // This is needed to avoid the un-animate aos effect
        });
      },
    });
  }
}

Vue.use(new AosPlugin());
