import { createApp } from '../main'
import { getRender } from 'fastify-vite-vue/server'

export const render = getRender(createApp)
