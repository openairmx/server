import { createServer } from 'node:http'

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('It works!\n')
  } else if (req.method === 'GET' && req.url === '/gettime') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ time: Math.floor(Date.now() / 1000) }))
  } else if (req.method === 'GET' && req.url.startsWith('/eagle')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 200, data: { eagleId: 0 } }))
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
