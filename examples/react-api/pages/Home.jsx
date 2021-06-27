import { useState } from 'react'
import { useHydration, onRouteChange } from 'fastify-vite-react/client'

export const path = '/'

// This function is loaded on the server and executed before the component
// useHydration() will contain its return value when the component runs
export async function getData ({ $api }) {
  const msg = `hello from ${isServer ? 'server' : 'client'}`
  const { json } = await $api.echo({ msg })
  return json
}

export default function Home(props) {  
  const ctx = useHydration()

  const [msg, setMsg] = useState(null)
  const [count, setCount] = useState(0)

  onRouteChange(ctx, async () => {
    const { json } = await getData(ctx)
    setMsg(json.msg)
  })

  // Triggered by a button, does a fresh $api fetch()
  const fetchFromEcho = async () => {
    const { json } = await ctx.$api.echo({ msg: 'hello from client button' })
    setMsg(`${json.msg} ${count}`)
    setCount(count + 1)
  }

  // ctx.$loading is set automatically for onRouteChange
  if (ctx.$loading) {
    <div>
      <h1>Loading</h1>
    </div>
  } else {
    return (
      <div>
        <h1>Home</h1>
        <p>Here's some data from the server: {ctx.$global}</p>
        <button onClick={() => setCount(++count)}>count is: {count}</button>
        <button onClick={fetchFromEcho}>msg is: {msg || ctx.$data.msg}</button >
      </div>
    )
  }
}