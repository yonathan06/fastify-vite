const manifetch = require('manifetch')

const { useLocation } = require('react-router-dom')
const { useContext, useState, useEffect, useRef } = require('react')
const { Context } = require('./context')

const dataKey = '$data'
const globalDataKey = '$global'
const noop = () => {}
const isServer = typeof window === 'undefined'

function onRouterChange (ctx, callback) {
  if (isServer) {
    return
  }
  const firstRender = useRef(true)  
  const effectWatcher = [useLocation()]
  useEffect(() => {
    ctx.update({ $loading: false })
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    ctx.update({ $loading: true })
    callback().then(() => ctx.update({ $loading: false }))
  }, effectWatcher)
}

function useHydration () {
  const { context } = useContext(Context)
  const [ state, update ] = useState(context)
  if (!isServer) {
    state.update = (prop) => update({ ...state, ...props })
  } else {
    state.update = noop
  }
  return state
}

function hydrate (app) {
  const dataSymbol = Symbol.for(dataKey)
  const globalDataSymbol = Symbol.for(globalDataKey)
  const apiSymbol = Symbol.for('fastify-vite-api')
  const context = {
    [globalDataKey]: window[globalDataSymbol],
    $dataPath: () => `/-/data${document.location.pathname}`,
    [dataKey]: window[dataSymbol],
    $api: window[apiSymbol],
    requests: [],
  }
  context.$api = new Proxy(context.$api, {
    get: manifetch({
      prefix: '',
      fetch: (...args) => window.fetch(...args),
    }),
  })
  return context
}

module.exports = {
  isServer,
  useIsomorphic,
  hydrate,
}
