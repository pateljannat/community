import { createPinia } from 'pinia'
import { createApp } from './main.js'
import {
	FrappeUI,
	setConfig,
	frappeRequest,
	resourcesPlugin,
	pageMetaPlugin,
} from 'frappe-ui'
import router from './router'
import translationPlugin from './translation'
import { usersStore } from './stores/user'
import { sessionStore } from './stores/session'
import { initSocket } from './socket'
import dayjs from '@/utils/dayjs'
import './index.css'

const app = createApp()
let pinia = createPinia()
setConfig('resourceFetcher', frappeRequest)

app.use(FrappeUI)
app.use(pinia)
app.use(router)
app.use(translationPlugin)
app.use(pageMetaPlugin)
app.provide('$dayjs', dayjs)
app.provide('$socket', initSocket())
app.mount('#app')

const { userResource } = usersStore()
let { isLoggedIn } = sessionStore()

app.provide('$user', userResource)
app.config.globalProperties.$user = userResource
