import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '~css/main.css'

// Thin Backend removed: no remote init

// Register service worker only in production to avoid dev caching issues
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
}

createApp(App).use(router).mount('#app')
