import { createServer } from 'node:http'

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })

  if (req.method === 'GET' && req.url === '/gettime') {
    res.end(JSON.stringify({
      time: Math.floor(Date.now() / 1000)
    }))
  } else if (req.method === 'GET' && req.url.startsWith('/eagle')) {
    res.end(JSON.stringify({
      status: 200, data: { eagleId: 0 }
    }))
  } else {
    res.end('It works!\n')
  }
})

const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 80

server.listen(port, hostname, () => {
  console.log(`Listening on ${hostname}:${port}`)
})
