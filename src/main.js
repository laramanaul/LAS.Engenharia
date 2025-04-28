import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { auth } from './firebase';
import './assets/css/index.css';  // Importa todos estilos modulados





let app;

auth.onAuthStateChanged(user => {
  if (!app) {
    app = createApp(App);
    app.use(router).mount('#app');
  }
});
