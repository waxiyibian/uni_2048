import { createSSRApp } from "vue";
import App from "./App.vue";
import './assets/scss/style.scss'
import './assets/scss/main.scss'
export function createApp() {
  const app = createSSRApp(App);
  return {
    app,
  };
}
