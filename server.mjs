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

server.listen(80, '0.0.0.0', () => {
  console.log('Listening on 0.0.0.0:80')
})
