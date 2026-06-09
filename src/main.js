import { createApp } from 'vue'
import './styles/variables.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/cards.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')