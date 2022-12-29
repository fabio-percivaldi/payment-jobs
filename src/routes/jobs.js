'use strict'

const express = require('express')
const router = express.Router()
const logger = require('pino')()
const { sequelize } = require('../model')
const { Op } = require('sequelize')
const { getProfile } = require('../middleware/getProfile')
const {
  PROFILE_TYPES,
  CONTRACT_STATUS,
  DATABASE_ERROR,
  Job,
  Contract,
  Profile,
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

const payJob = async(job, clientProfile, contractorProfile, paymentTransaction) => {
  try {
    job.paid = true
    job.paymentDate = new Date()
    await job.save({ transaction: paymentTransaction })
  } catch (error) {
    logger.error({ error: error.message, job: job.id }, 'Error while updating payment')
    await paymentTransaction.rollback()
    throw error
  }
  try {
    clientProfile.balance -= job.price
    await clientProfile.save({ transaction: paymentTransaction })
  } catch (error) {
    logger.error({ error: error.message }, 'Error while updating client balance')
    await paymentTransaction.rollback()
    throw error
  }
  try {
    contractorProfile.balance += job.price
    await contractorProfile.save({ transaction: paymentTransaction })
  } catch (error) {
    logger.error({ error: error.message }, 'Error while updating contractor balance')
    await paymentTransaction.rollback()
    throw error
  }
  await paymentTransaction.commit()
}

/**
 * @returns pay a job
 */
// eslint-disable-next-line max-statements
router.post('/jobs/:job_id/pay', getProfile, async(req, res) => {
  const { profile } = req
  const { job_id: jobId } = req.params

  const { balance, type } = profile

  if (type !== PROFILE_TYPES.CLIENT) {
    logger.error({ job: jobId }, 'Only clients can pay jobs')
    return res.status(401).json({
      error: 'UNAUTHORIZED_PAY',
      message: 'Only clients can pay jobs',
    })
  }

  const paymentTransaction = await sequelize.transaction()
  const job = await Job.findOne({ where: { id: jobId }, transaction: paymentTransaction })

  const { paid } = job
  if (paid) {
    await paymentTransaction.rollback()
    return res.status(400).json({
      error: 'JOB_ALREADY_PAID',
      message: `The job with ${jobId} id is already paid`,
    })
  }
  if (!job) {
    await paymentTransaction.rollback()
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Job with ${jobId} not found`,
    })
  }
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
      await payJob(job, profile, contractor, paymentTransaction)
    } catch (error) {
      if (error.parent.code === DATABASE_ERROR.LOCK_ERROR) {
        return res.status(500).json({
          error: 'PAYMENT_ERROR',
          message: 'Error while paying a job',
        })
      }
    }
  } else {
    await paymentTransaction.rollback()
    return res.status(400).json({
      error: 'INSUFFICIENT_BALANCE',
      message: 'The balance amount is not enough to pay the job',
    })
  }
  res.status(201).end()
})

module.exports = router
