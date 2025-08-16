import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '~css/main.css'

// thin-backend init
import { initThinBackend } from 'thin-backend'
initThinBackend({ host: 'https://cooker.thinbackend.app' })

// Register service worker only in production to avoid dev caching issues
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
}

createApp(App).use(router).mount('#app')
