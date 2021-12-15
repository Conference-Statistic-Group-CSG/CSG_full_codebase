require('dotenv').config()
const cors = require('cors')
const helmet = require('helmet')
const express = require('express')

const app = express()

app.use(cors())
app.use(helmet())
app.use(express.json())

app.get('/ping', (req, res) => {
  res.send('pong!')
})

module.exports = app
