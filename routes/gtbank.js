const express = require('express')
const { scraper } = require('../lib/gtbank/scraper')
const router = express.Router()

router.get('/', function(req, res, next) {
  res.json({
    status: 'success',
    message: 'GTBank Internet Banking'
  })
})

router.post('/login', async function(req, res, next) {
  const { username, password } = req.body
  const result = await scraper.login(username, password)
  res.json(result)
})

router.get('/:sessionId/transactions', async function(req, res, next) {
  const { sessionId } = req.params
  const result = await scraper.getTransactions(sessionId)
  res.json(result)
})

router.get('/transfer', async function(req, res, next) {
  res.json({
    status: 'failure',
    message: 'This endpoint has not been implemented yet'
  })
})

module.exports = router
