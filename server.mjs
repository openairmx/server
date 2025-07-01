'use strict'

import { DatabaseSync } from 'node:sqlite'
import { createServer } from 'node:http'

const database = new DatabaseSync(':memory:')

database.exec(`
  CREATE TABLE eagles(
    id INTEGER PRIMARY KEY,
    mac_address TEXT,
    key TEXT
  ) STRICT
`)

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('It works!\n')
  } else if (req.method === 'GET' && req.url === '/gettime') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ time: Math.floor(Date.now() / 1000) }))
  } else if (req.method === 'GET' && req.url.startsWith('/eagle')) {
    const params = new URLSearchParams(req.url.substring('/eagle'.length))
    const mac = params.get('mac')
    const key = params.get('key')
    if (mac === null || key === null) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end('{}\n')
      return
    }
    const insert = database.prepare('INSERT INTO eagles(mac_address, key) VALUES(?, ?)')
    const record = insert.run(mac, key)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 200, data: { eagleId: record.lastInsertRowid } }))
  } else {
    res.writeHead(404)
    res.end()
  }
})

const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 80

server.listen(port, hostname, () => {
  console.log(`Listening on ${hostname}:${port}`)
})
