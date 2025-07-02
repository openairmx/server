'use strict'

import { DatabaseSync } from 'node:sqlite'
import { createServer } from 'node:http'

const initializeDatabase = () => {
  const db = new DatabaseSync(':memory:')

  db.exec(`
    CREATE TABLE eagles(
      id INTEGER PRIMARY KEY,
      mac_address TEXT,
      key TEXT
    ) STRICT
  `)

  return db
}

const indexController = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('It works!\n')
}

const getTimeControlller = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ time: Math.floor(Date.now() / 1000) }))
}

const eagleController = (req, res) => {
  const [, query] = req.url.split('?')
  const params = new URLSearchParams(query)

  switch (params.get('path')) {
    case 'eagle/GET/genId':
      eagleGenIdController(req, res)
      break
    case 'eagle/GET/online':
      eagleOnlineController(req, res)
      break
    default:
      notFoundController(req, res)
      break
  }
}

const eagleGenIdController = (req, res) => {
  const [, query] = req.url.split('?')
  const params = new URLSearchParams(query)
  const { mac, key } = JSON.parse(params.get('params') || '{}')

  if (mac === undefined || mac === null
    || key === undefined || key === null) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end('{}\n')
    return
  }

  const record = database
    .prepare('INSERT INTO eagles(mac_address, key) VALUES(?, ?)')
    .run(mac, key)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    status: 200,
    data: {
      eagleId: record.lastInsertRowid
    }
  }))
}

const eagleOnlineController = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    status: 200,
    data: {
      snow: 1,  // Air quality monitor
      eagle: 1  // The AIRMX Pro unit
    }
  }))
}

const exchangeController = (req, res) => {
  const [, query] = req.url.split('?')
  const params = new URLSearchParams(query)
  const device = params.get('device')

  if (device === null) {
    res.writeHead(422)
    res.end()
    return
  }

  const record = database
    .prepare('SELECT * FROM eagles WHERE id = ?')
    .get(device)

  if (record === undefined) {
    res.writeHead(404)
    res.end()
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ key: record.key }))
}

const notFoundController = (req, res) => {
  res.writeHead(404)
  res.end()
}

const server = createServer((req, res) => {
  const routes = [
    { method: 'GET', path: '/', handler: indexController },
    { method: 'GET', path: '/gettime', handler: getTimeControlller },
    { method: 'GET', path: '/eagle', handler: eagleController },
    { method: 'GET', path: '/exchange', handler: exchangeController },
  ]

  const [path] = req.url.split('?')
  for (const route of routes) {
    if (req.method === route.method && path === route.path) {
      return route.handler(req, res)
    }
  }

  notFoundController(req, res)
})

const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 80
const database = initializeDatabase()

server.listen(port, hostname, () => {
  console.log(`Listening on ${hostname}:${port}`)
})
