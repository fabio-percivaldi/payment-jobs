'use strict'

const express = require('express')
const router = express.Router()
const { getProfile } = require('../middleware/getProfile')
const {
  Contract,
  Job,
} = require('../model')

const getMaxBalanceByJob = (jobs) => {
  return jobs.reduce((prev, curr) => {
    return prev + curr.price
  }, 0)
}

/**
 * @returns contract by id
 */
router.post('/balances/deposit/:userId', getProfile, async(req, res) => {
  const { userId } = req.params
  const { profile, body } = req
  const { amount } = body
  // eslint-disable-next-line eqeqeq
  if (userId != profile.id) {
    return res.status(401).json({
      error: 'UNAUTHORIZED_DEPOSIT',
      message: `Profile ${profile.id} is not the same of the request client ${userId}`,
    })
  }

  const contracts = await Contract.findAll({ where: { ClientId: userId },
    include: {
      model: Job,
      as: 'Jobs',
      where: {
        paid: null,
      },
    } })

  if (contracts.length === 0) {
    return res.status(400).json({
      error: 'NOT_FOUND',
      message: `The requested client has no active job to pay`,
    })
  }

  const maxBalance = getMaxBalanceByJob(contracts.map(contract => contract.Jobs).flat())
  if (amount > maxBalance) {
    return res.status(400).json({
      error: 'INVALID_AMOUNT',
      message: `The deposit amount can not exceed the 25% of total job to pay that is ${maxBalance}`,
    })
  }
  profile.balance += amount
  await profile.save()

  return res.status(204).end()
})

module.exports = router
