
import Fastify from 'fastify'
import FastifyVite from 'fastify-vite'
import renderer from 'fastify-vite-vue'

async function main () {
  const app = Fastify({ logger: true })
  const root = import.meta.url
  await app.register(FastifyVite, { root, renderer })
  await app.vite.ready()
  return app
}

if (!process.argv.includes('test')) {
  const app = await main()
  await app.listen(3000)
}

export default main
