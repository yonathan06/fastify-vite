const { createComponent, renderToString } = require('solid-js/web')
const devalue = require('devalue')
const { renderTags } = require('solid-meta')
const { ContextProvider } = require('./context')

function createRenderFunction (createApp) {
  return async function render (fastify, req, reply, url, options) {
    const { entry, hydration } = options
    const { App, router, routes, context } = createApp({
      fastify,
      req,
      reply,
      $payloadPath: () => `/-/data${req.routerPath}`,
      [hydration.global]: req[hydration.global],
      [hydration.payload]: req[hydration.payload],
      [hydration.data]: req[hydration.data],
      $api: req.api && req.api.client,
    })

    let resolvedRoutes
    if (typeof routes === 'function') {
      resolvedRoutes = await routes()
    }
    const app = App(resolvedRoutes)
    const element = renderElement(req.url, app, context, router)
    const hydrationScript = getHydrationScript(req, context, hydration, resolvedRoutes)

    return {
      entry: entry.client,
      hydration: hydrationScript,
      element,
      meta: renderTags(),
    }
  }
}

module.exports = { createRenderFunction }

function getHydrationScript (req, context, hydration, routes) {
  const globalData = req.$global
  const data = req.$data
  const payload = req.$payload
  const api = req.api ? req.api.meta : null

  let hydrationScript = ''

  if (routes || globalData || data || payload || api) {
    hydrationScript += '<script>'
    if (routes) {
      const clientRoutes = routes.map(({ path, componentPath }) => {
        return { path, componentPath }
      })
      hydrationScript += `window[Symbol.for('kRoutes')] = ${devalue(clientRoutes)}\n`
    }
    if (globalData) {
      hydrationScript += `window[Symbol.for('kGlobal')] = ${devalue(globalData)}\n`
    }
    if (data) {
      hydrationScript += `window[Symbol.for('kData')] = ${devalue(data)}\n`
    }
    if (payload) {
      hydrationScript += `window[Symbol.for('kPayload')] = ${devalue(payload)}\n`
    }
    if (api) {
      hydrationScript += `window[Symbol.for('kAPI')] = ${devalue(api)}\n`
    }
    hydrationScript += '</script>'
  }

  return hydrationScript
}

function renderElement (url, app, context, router) {
  if (router) {
    return renderToString(
      createComponent(router, {
        location: url,
      }, createComponent(ContextProvider, {
        children: app,
        context,
      })),
    )
  } else {
    return renderToString(
      createComponent(ContextProvider, { context, children: app }),
    )
  }
}
