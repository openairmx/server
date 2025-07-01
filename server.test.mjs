'use strict'

import assert from 'node:assert'
import test, { after, before } from 'node:test'
import { spawn } from 'node:child_process'

const hostname = '127.0.0.1'
const port = 8090
const baseUrl = `http://${hostname}:${port}`
let server = null

const createDevice = async (mac, key) => {
  const response = await fetch(`${baseUrl}/eagle?mac=${mac}&key=${key}`)
  const data = await response.json()
  return data.data.eagleId
}

before(() => new Promise((resolve, reject) => {
  const nodeBinary = process.argv[0]
  server = spawn(nodeBinary, ['server.mjs'], {
    env: {
      HOSTNAME: hostname,
      PORT: port
    }
  })

  server.stdout.on('data', (data) => {
    console.log(`server stdout: ${data}`)
    if (data.toString().includes('Listening on')) {
      resolve()
    }
  })

  server.stderr.on('data', (data) => {
    console.log(`server stderr: ${data}`)
  })

  server.on('error', (err) => {
    reject(new Error(`Server failed to start: ${err}`))
  })
}))

after(() => {
  if (server) {
    server.kill()
    server = null
  }
})

test('current time endpoint', async () => {
  const res = await fetch(`${baseUrl}/gettime`)
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.headers.get('content-type'), 'application/json')
  const data = await res.json()
  const current = Math.floor(Date.now() / 1000)
  assert.ok(typeof data.time === 'number')
  assert.ok(current - data.time < 3)
})

test('device registration endpoint', async () => {
  const stubMacAddress = '00:00:00:00:00'
  const stubKey = '00000000000000000000000000000000'
  const res = await fetch(`${baseUrl}/eagle?mac=${stubMacAddress}&key=${stubKey}`)
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.headers.get('content-type'), 'application/json')
  const data = await res.json()
  assert.strictEqual(data.status, 200)
  assert.ok(typeof data.data?.eagleId === 'number')
})

test('device registration endpoint returns bad request if missing mac address', async () => {
  const stubKey = '00000000000000000000000000000000'
  const res = await fetch(`${baseUrl}/eagle?key=${stubKey}`)
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.headers.get('content-type'), 'application/json')
})

test('device registration endpoint returns bad request if missing encryption key', async () => {
  const stubMacAddress = '00:00:00:00:00'
  const res = await fetch(`${baseUrl}/eagle?mac=${stubMacAddress}`)
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.headers.get('content-type'), 'application/json')
})

test('exchange endpoint', async () => {
  const stubMacAddress = '00:00:00:00:00'
  const stubKey = '00000000000000000000000000000000'

  const deviceId = await createDevice(stubMacAddress, stubKey)
  const res = await fetch(`${baseUrl}/exchange?device=${deviceId}`)
  assert.strictEqual(res.status, 200)

  const data = await res.json()
  assert.strictEqual(data.key, stubKey)
})

test('exchange endpoint returns unprocessable content when device id is missing', async () => {
  const res = await fetch(`${baseUrl}/exchange`)
  assert.strictEqual(res.status, 422)
})

test('exchange endpoint returns not found when device does not exist', async () => {
  const res = await fetch(`${baseUrl}/exchange?device=9999`)
  assert.strictEqual(res.status, 404)
})
