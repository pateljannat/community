import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { compileTemplate, compileScript, parse } from 'vue/compiler-sfc'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { createServer } from 'vite'

const vite = await createServer({
	server: { middlewareMode: true },
	appType: 'custom',
})

let template = readFileSync(resolve('index.html'), 'utf-8')
//template = await vite.transformIndexHtml(template);

const render = (await vite.ssrLoadModule('./src/entry_server.js')).render

const { html: appHtml } = await render()
const html = template.replace('<!--main-app-->', appHtml)

process.stdout.write(html)
vite.close()
