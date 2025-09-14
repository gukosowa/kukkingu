import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '~css/main.css'
import '~src/services/fileExport'
import { migrateFromLocalStorage } from '~src/services/indexeddb'

// Thin Backend removed: no remote init

// Migrate from localStorage to IndexedDB on startup
migrateFromLocalStorage().catch(console.error)

// Register service worker only in production to avoid dev caching issues
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
}

createApp(App).use(router).mount('#app')
