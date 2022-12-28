'use strict'

const express = require('express')
const router = express.Router()
const logger = require('pino')()
const { sequelize } = require('../model')
const { Op } = require('sequelize')
const { getProfile } = require('../middleware/getProfile')
const {
  PROFILE_TYPES, CONTRACT_STATUS, Job, Contract, Profile,
} = require('../model')

/**
 * @returns list unpaid jobs
 */
router.get('/jobs/unpaid', getProfile, async(req, res) => {
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

const payJob = async(job, clientProfile, contractorProfile) => {
  const paymentTransaction = await sequelize.transaction()

  try {
    job.paid = true
    job.paymentDate = new Date()
    await job.save()
  } catch (error) {
    logger.error({ error: error.message }, 'Error while updating payment')
    await paymentTransaction.rollback()
  }
  try {
    clientProfile.balance -= job.price
    await clientProfile.save()
  } catch (error) {
    logger.error({ error: error.message }, 'Error while updating client balance')
    await paymentTransaction.rollback()
  }
  try {
    contractorProfile.balance += job.price
    await contractorProfile.save()
  } catch (error) {
    logger.error({ error: error.message }, 'Error while updating contractor balance')
    await paymentTransaction.rollback()
  }
  await paymentTransaction.commit()
}

/**
 * @returns pay a job
 */
router.post('/jobs/:job_id/pay', getProfile, async(req, res) => {
  const { profile } = req
  const { job_id: jobId } = req.params

  const { balance, type } = profile

  if (type !== PROFILE_TYPES.CLIENT) {
    logger.error('Only clients can pay jobs')
    res.status(401).json({
      error: 'UNAUTHORIZED_PAY',
      errorCode: '4001',
      message: 'Only clients can pay jobs',
    })
  }

  const job = await Job.findOne({ where: { id: jobId } })

  if (!job) { return res.status(404).end() }
  const {
    price,
    ContractId,
  } = job

  if (balance >= price) {
    const contract = await Contract.findOne({ where: { id: ContractId },
      include: {
        model: Profile,
        as: 'Contractor',
      } })

    const { Contractor: contractor } = contract
    try {
      await payJob(job, profile, contractor)
    } catch (error) {
      logger.error({ error: error.message, job: jobId }, 'Error while paying job')
      res.status(500).json({
        error: 'PAYMENT_ERROR',
        errorCode: '5001',
        message: 'Error while paying a job',
      })
    }
  }
  res.status(201).end()
})

module.exports = router
