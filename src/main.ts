import { createApp } from 'vue'
import './styles/variables.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/cards.css'
import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'

initTheme()

const app = createApp(App)
app.use(router)
app.mount('#app')
