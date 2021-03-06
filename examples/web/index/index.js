const express = require('express')
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get(`/`, (req, res) => {
  res.send({
    message: 'Hello Serverless'
  })
})

app.get(`/headers`, (req, res) => {
  res.send({
    headers: req.headers
  })
})

app.post('/body', (req, res) => {
  res.send({
    body: req.body
  })
})

app.get('/404', (req, res) => {
  res.status(404).send('Not found')
})

app.get('/500', (req, res) => {
  res.status(500).send('Server Error')
})

// Error handler
app.use(function(err, req, res, next) {
  console.error(err)
  res.status(500).send('Internal Serverless Error')
})

// Web 类型云函数，只能监听地址 0.0.0.0 和 端口 9000
app.listen(9000, '0.0.0.0', () => {
  console.log(`Server start on http://0.0.0.0:9000`)
})
