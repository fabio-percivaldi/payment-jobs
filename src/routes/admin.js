'use strict'

const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const { getProfile } = require('../middleware/getProfile')
const {
  Profile,
  Job,
  Contract,
  PROFILE_TYPES,
} = require('../model')

const getMostPaidJob = (jobSumByProfession) => {
  let mostPaidProfession
  let mostPaidJobs = 0
  for (const [profession, jobSum] of Object.entries(jobSumByProfession)) {
    if (jobSum >= mostPaidJobs) {
      mostPaidJobs = jobSum
      mostPaidProfession = profession
    }
  }

  return {
    profession: mostPaidProfession,
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

/**
 * @returns contract by id
 */
router.get('/admin/best-profession', getProfile, async(req, res) => {
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
        },
      },
    } })

  const jobSumByProfession = getJobSumByProfession(profiles)
  const bestProfession = getMostPaidJob(jobSumByProfession)

  res.status(200).json(bestProfession)
})

module.exports = router
