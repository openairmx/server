'use strict'

import assert from 'node:assert'
import test, { after, before } from 'node:test'
import { spawn } from 'node:child_process'

const hostname = '127.0.0.1'
const port = 8090
const baseUrl = `http://${hostname}:${port}`
let server = null

const createDevice = async (mac, key) => {
  const params = new URLSearchParams({
    source: 5,
    reqid: '0000000000',
    eagleId: '',
    path: 'eagle/GET/genId',
    params: JSON.stringify({
      mac,
      key,
      version: '00.00.00',
      isDenoise: 1,
      hardVersion: 1
    }),
    sig: '00000000000000000000000000000000'
  })
  const response = await fetch(`${baseUrl}/eagle?${params.toString()}`)
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
  const stubMacAddress = '0000000000'
  const stubKey = '00000000000000000000000000000000'
  const params = new URLSearchParams({
    source: 5,
    reqid: '0000000000',
    eagleId: '',
    path: 'eagle/GET/genId',
    params: JSON.stringify({
      mac: stubMacAddress,
      key: stubKey,
      version: '00.00.00',
      isDenoise: 1,
      hardVersion: 1
    }),
    sig: '00000000000000000000000000000000'
  })
  const res = await fetch(`${baseUrl}/eagle?${params.toString()}`)
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.headers.get('content-type'), 'application/json')
  const data = await res.json()
  assert.strictEqual(data.status, 200)
  assert.ok(typeof data.data?.eagleId === 'number')
})

test('device registration endpoint returns bad request if missing mac address', async () => {
  const stubKey = '00000000000000000000000000000000'
  const params = new URLSearchParams({
    source: 5,
    reqid: '0000000000',
    eagleId: '',
    path: 'eagle/GET/genId',
    params: JSON.stringify({
      key: stubKey,
      version: '00.00.00',
      isDenoise: 1,
      hardVersion: 1
    }),
    sig: '00000000000000000000000000000000'
  })
  const res = await fetch(`${baseUrl}/eagle?${params.toString()}`)
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.headers.get('content-type'), 'application/json')
})

test('device registration endpoint returns bad request if missing encryption key', async () => {
  const stubMacAddress = '0000000000'
  const params = new URLSearchParams({
    source: 5,
    reqid: '0000000000',
    eagleId: '',
    path: 'eagle/GET/genId',
    params: JSON.stringify({
      mac: stubMacAddress,
      version: '00.00.00',
      isDenoise: 1,
      hardVersion: 1
    }),
    sig: '00000000000000000000000000000000'
  })
  const res = await fetch(`${baseUrl}/eagle?${params.toString()}`)
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.headers.get('content-type'), 'application/json')
})

test('device registration endpoint returns not found if path is not supported', async () => {
  const params = new URLSearchParams({ path: 'eagle/GET/foo' })
  const res = await fetch(`${baseUrl}/eagle?${params.toString()}`)
  assert.strictEqual(res.status, 404)
})

test('device status endpoint', async () => {
  const params = new URLSearchParams({
    source: 5,
    reqid: '0000000000',
    eagleId: 1,
    path: 'eagle/GET/online',
    params: '{}',
    sig: '00000000000000000000000000000000'
  })
  const res = await fetch(`${baseUrl}/eagle?${params.toString()}`)
  assert.strictEqual(res.status, 200)
  const data = await res.json()
  assert.strictEqual(data.data.snow, 1)
  assert.strictEqual(data.data.eagle, 1)
})

test('exchange endpoint', async () => {
  const stubMacAddress = '0000000000'
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
