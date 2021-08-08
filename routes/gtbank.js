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

router.post('/:sessionId/transfer', async function(req, res, next) {
  const { sessionId } = req.params
  const { accountNumber, amount } = req.body
  const result = await scraper.initiateTransfer(sessionId, accountNumber, amount)
  res.json(result)
})

router.post('/:sessionId/otp-and-secret-answer', async function(req, res, next) {
  const { sessionId } = req.params
  const { otp, secretAnswer } = req.body
  const result = await scraper.completeBeneficiaryCreation(sessionId, otp, secretAnswer)
  res.json(result)
})

router.post('/:sessionId/otp', async function(req, res, next) {
  const { sessionId } = req.params
  const { otp } = req.body
  const result = await scraper.completeTransfer(sessionId, otp)
  res.json(result)
})

module.exports = router
