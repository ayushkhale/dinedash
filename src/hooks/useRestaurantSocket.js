import { useEffect } from 'react'
import { io } from 'socket.io-client'

export function useRestaurantSocket({
  user,
  setOrders,
  setWaiterCalls
}) {
  useEffect(() => {
    const ts = () => new Date().toISOString()

    if (!user?.restaurant_id) {
      console.warn(`[Socket][${ts()}] ⛔ Skipping — no restaurant_id on user`, user)
      return
    }

    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.0.104:3005'
    console.info(`[Socket][${ts()}] 🔌 Initialising connection to: ${BASE_URL}`)
    console.info(`[Socket][${ts()}] 👤 userId: ${user.id} | restaurant_id: ${user.restaurant_id}`)

    const socketConn = io(BASE_URL, {
      transports: ['websocket'],
      query: { userId: user.id },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketConn.on('connect', () => {
      const roomName = `restaurant_${user.restaurant_id}`
      console.log(`[Socket][${ts()}] ✅ Connected | socket.id: ${socketConn.id} | transport: ${socketConn.io.engine.transport.name}`)

      socketConn.emit('join_room', roomName, (ack) => {
        if (ack) {
          console.log(`[Socket][${ts()}] 🏠 Room join ACK received:`, ack)
        } else {
          console.log(`[Socket][${ts()}] 🏠 Room join emitted (no ack from server): ${roomName}`)
        }
      })
    })

    socketConn.on('disconnect', (reason) => {
      console.warn(`[Socket][${ts()}] ❌ Disconnected | reason: "${reason}"`)
      if (reason === 'io server disconnect') {
        console.info(`[Socket][${ts()}] 🔄 Server-initiated disconnect — attempting manual reconnect`)
        socketConn.connect()
      }
    })

    socketConn.on('connect_error', (err) => {
      console.error(`[Socket][${ts()}] 💥 connect_error: ${err.message}`)
    })

    socketConn.on('reconnect_attempt', (attempt) => {
      console.info(`[Socket][${ts()}] 🔁 Reconnect attempt #${attempt}`)
    })

    socketConn.on('reconnect', (attempt) => {
      console.log(`[Socket][${ts()}] ♻️  Reconnected after ${attempt} attempt(s) | socket.id: ${socketConn.id}`)
    })

    socketConn.on('new_order', (newOrder) => {
      console.log(`[Socket][${ts()}] 📦 new_order received:`, newOrder)
      setOrders((prev) => [newOrder, ...prev])
    })

    socketConn.on('waiter_call', (newCall) => {
      console.log(`[Socket][${ts()}] 🛎️  waiter_call received:`, newCall)
      setWaiterCalls((prev) => [newCall, ...prev])
    })

    socketConn.on('order_status_update', (payload) => {
      console.log(`[Socket][${ts()}] 🔄 order_status_update:`, payload)
      setOrders((prev) =>
        prev.map(ord => ord.id === payload.id ? { ...ord, status: payload.status } : ord)
      )
    })

    socketConn.on('payment_status_update', (payload) => {
      console.log(`[Socket][${ts()}] 💳 payment_status_update:`, payload)
      setOrders((prev) =>
        prev.map(ord => ord.id === payload.id ? { ...ord, payment_status: payload.payment_status } : ord)
      )
    })

    socketConn.on('waiter_call_resolved', (payload) => {
      console.log(`[Socket][${ts()}] ✔️  waiter_call_resolved:`, payload)
      setWaiterCalls((prev) => prev.filter(c => c.id !== payload.id))
    })

    return () => {
      console.info(`[Socket][${ts()}] 🧹 Cleaning up — disconnecting socket ${socketConn.id}`)
      socketConn.disconnect()
    }
  }, [user?.restaurant_id, user?.id, setOrders, setWaiterCalls])
}
