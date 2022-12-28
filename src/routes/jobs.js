'use strict'

const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const { getProfile } = require('../middleware/getProfile')
const {
  PROFILE_TYPES, CONTRACT_STATUS, Job,
} = require('../model')

/**
 * @returns contract by id
 */
router.get('/jobs/unpaid', getProfile, async(req, res) => {
  const { Contract } = req.app.get('models')
  const { profile } = req
  const { id: profileId, type } = profile

  let query = {
    [Op.or]: [
      { status: CONTRACT_STATUS.NEW },
      { status: CONTRACT_STATUS.IN_PROGRESS },
    ],
  }
  if (type === PROFILE_TYPES.CLIENT) {
    query = {
      ...query,
      ClientId: profileId,
    }
  } else {
    query = {
      ...query,
      ContractorId: profileId,
    }
  }

  const contracts = await Contract.findAll({ where: query,
    include: {
      model: Job,
      as: 'Jobs',
      where: {
        paid: null,
      },
    } })
  if (!contracts) { return res.status(404).end() }
  const jobs = contracts.map(contract => contract.Jobs)
  res.json(jobs.flat())
})

module.exports = router
