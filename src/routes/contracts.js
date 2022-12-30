'use strict'

const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const { getProfile } = require('../middleware/getProfile')
const {
  Contract,
} = require('../model')

/**
 * @returns contract by id
 */
router.get('/contracts/:id', getProfile, async(req, res) => {
  const { id } = req.params
  const { profile } = req
  const contract = await Contract.findOne({ where: { id, ContractorId: profile.id } })
  if (!contract) { return res.status(404).end() }
  res.json(contract)
})

router.get('/contracts', getProfile, async(req, res) => {
  const { profile } = req
  const contracts = await Contract.findAll({ where: { ContractorId: profile.id,
    [Op.or]: [
      { status: 'new' },
      { status: 'in_progress' },
    ] } })
  if (!contracts) { return res.status(404).end() }
  res.json(contracts)
})

module.exports = router
