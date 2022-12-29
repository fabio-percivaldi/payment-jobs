'use strict'

const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const { getProfile } = require('../middleware/getProfile')
const { DateTime } = require('luxon')
const logger = require('pino')()

const {
  Profile,
  Job,
  Contract,
  PROFILE_TYPES,
} = require('../model')

const getHighestValue = (jobSumByField) => {
  let mostPaid
  let mostPaidJobs = 0
  for (const [field, jobSum] of Object.entries(jobSumByField)) {
    if (jobSum >= mostPaidJobs) {
      mostPaidJobs = jobSum
      mostPaid = field
    }
  }

  return {
    id: mostPaid,
    sum: mostPaidJobs,
  }
}

const getJobSum = (jobs) => {
  return jobs.reduce((prev, curr) => {
    return prev + curr.price
  }, 0)
}

const getJobSumByProfession = (profiles) => {
  const profilesByProfession = {}
  profiles.forEach(({ profession, Contractor }) => {
    const jobs = Contractor.map(contr => contr.Jobs).flat()
    if (profilesByProfession[profession] === undefined) {
      profilesByProfession[profession] = getJobSum(jobs)
    } else {
      profilesByProfession[profession] += getJobSum(jobs)
    }
  })
  return profilesByProfession
}

const getJobSumByClient = (profiles) => {
  const profilesByClient = {}
  profiles.forEach(({ id, Client }) => {
    const jobs = Client.map(contr => contr.Jobs).flat()
    if (profilesByClient[id] === undefined) {
      profilesByClient[id] = getJobSum(jobs)
    } else {
      profilesByClient[id] += getJobSum(jobs)
    }
  })
  return profilesByClient
}

/**
 * @returns best paid profession in a data range
 */
router.get('/admin/best-profession', getProfile, async(req, res) => {
  const { start, end } = req.query
  const startDate = DateTime.fromISO(start)
  const endDate = DateTime.fromISO(end)
  if (!startDate.isValid || !endDate.isValid) {
    logger.error({ start, end }, 'Invalid date provided')
    return res.status(400).json({
      error: 'INVALID_DATES',
      message: 'The provided dates are not in the valid format',
    })
  }
  const profiles = await Profile.findAll({ where: { type: PROFILE_TYPES.CONTRACTOR },
    include: {
      model: Contract,
      as: 'Contractor',
      where: {
        [Op.or]: [
          { status: 'new' },
          { status: 'in_progress' },
        ],
      },
      include: {
        model: Job,
        as: 'Jobs',
        where: {
          paid: true,
          paymentDate: {
            [Op.gt]: startDate.toISO(),
            [Op.lt]: endDate.toISO(),
          },
        },
      },
    } })

  const jobSumByProfession = getJobSumByProfession(profiles)
  const bestProfession = getHighestValue(jobSumByProfession)

  res.status(200).json({
    profession: bestProfession.id,
    sum: bestProfession.sum,
  })
})

router.get('/admin/best-clients', getProfile, async(req, res) => {
  const { start, end, limit } = req.query
  const startDate = DateTime.fromISO(start)
  const endDate = DateTime.fromISO(end)
  if (!startDate.isValid || !endDate.isValid) {
    logger.error({ start, end }, 'Invalid date provided')
    return res.status(400).json({
      error: 'INVALID_DATES',
      message: 'The provided dates are not in the valid format',
    })
  }

  const profiles = await Profile.findAll({ where: { type: PROFILE_TYPES.CLIENT },
    include: {
      model: Contract,
      as: 'Client',
      where: {
        [Op.or]: [
          { status: 'new' },
          { status: 'in_progress' },
        ],
      },
      include: {
        model: Job,
        as: 'Jobs',
        where: {
          paid: true,
          paymentDate: {
            [Op.gt]: startDate.toISO(),
            [Op.lt]: endDate.toISO(),
          },
        },
      },
    } })

  const jobSumByClient = getJobSumByClient(profiles)
  const bestClient = getHighestValue(jobSumByClient)

  res.status(200).json([{
    client: bestClient.id,
    sum: bestClient.sum,
  }])
})

module.exports = router
