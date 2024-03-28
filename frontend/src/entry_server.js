import { renderToString } from 'vue/server-renderer'
import { createApp } from './main.js'
/**
 * initiate the Vue App for a server-side application,
 * we use renderToString to render the app to HTML
 */

export const render = async () => {
	const app = createApp()
	const html = await renderToString(app)

	return {
		html,
	}
}
