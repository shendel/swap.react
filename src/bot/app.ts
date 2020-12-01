import express from 'express'

import bodyparser from 'body-parser'
import path from 'path'

import SwapApp from './swapApp'
import ws from './ws'

import router from './routes'
import auth from './routes/auth'


const { app, wallet } = SwapApp
app.ready = new Promise( resolve => app.services.room.once('ready', resolve))
app.sync = new Promise( resolve => app.ready.then(() => setTimeout(resolve, 20000)) )


app.services.room.once('ready', () => {
  console.log('swapApp ready')

  console.log('btc', wallet.auth.accounts.btc.getAddress())
  console.log('eth', wallet.auth.accounts.eth.address)

  console.log('created swap app, me:', wallet.view())
})

const port = process.env.PORT || 1337
const ws_port = process.env.WS_PORT || 7333
const listen_ip = process.env.IP || '0.0.0.0'

const server = express()

server.use(auth)
server.use(express.static(path.join(__dirname, '/routes/web/')))
server.use(bodyparser.json())
server.use('/', router)

process.env.ENABLE_WEBSOCKET && ws.init(server, app, router, ws_port)

const listener = server.listen(port, listen_ip)
console.log(`[SERVER] listening on http://localhost:${port}`)
console.log('Run bot...')

export { server, app, listener }
