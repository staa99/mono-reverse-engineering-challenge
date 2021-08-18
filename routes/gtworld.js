const express = require('express')
const { apiClient: client } = require('../lib/gtworld/api-client')
const router = express.Router()

router.get('/', function(req, res, next) {
  res.json({
    status: 'success',
    message: 'GTWorld'
  })
})

router.post('/login', async function(req, res, next) {
  const { username, password } = req.body
  const result = await client.login(username, password)
  res.json(result)
})

router.get('/:sessionId/transactions', async function(req, res, next) {
  const { sessionId } = req.params
  const result = await client.getTransactions(sessionId)
  res.json(result)
})

module.exports = router
