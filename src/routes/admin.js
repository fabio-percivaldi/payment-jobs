'use strict'

const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const { sequelize } = require('../model')
const { getProfile } = require('../middleware/getProfile')
const { DateTime } = require('luxon')
const logger = require('pino')()

const {
  Profile,
  Job,
  Contract,
  PROFILE_TYPES,
} = require('../model')

const mapProfilesToResponse = (profiles) => {
  return profiles.map(profile => {
    return {
      client: profile.id,
      sum: profile.dataValues.jobSum,
    }
  })
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
  const profiles = await Profile.findAll({
    where: { type: PROFILE_TYPES.CONTRACTOR },
    attributes: [
      'id',
      'profession',
      [sequelize.fn('sum', sequelize.col('price')), 'jobSum'],
    ],
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
    },
    group: 'profession',
    order: [['jobSum', 'DESC']],
  })
  const [mostPaidJob] = profiles

  res.status(200).json({
    profession: mostPaidJob.profession,
    sum: mostPaidJob.dataValues.jobSum,
  })
})

router.get('/admin/best-clients', getProfile, async(req, res) => {
  const { start, end, limit = 2 } = req.query
  const startDate = DateTime.fromISO(start)
  const endDate = DateTime.fromISO(end)
  if (!startDate.isValid || !endDate.isValid) {
    logger.error({ start, end }, 'Invalid date provided')
    return res.status(400).json({
      error: 'INVALID_DATES',
      message: 'The provided dates are not in the valid format',
    })
  }

  const profiles = await Profile.findAll({
    where: { type: PROFILE_TYPES.CLIENT },
    attributes: [
      'id',
      [sequelize.fn('sum', sequelize.col('price')), 'jobSum'],
    ],
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
    },
    group: 'ClientId',
    order: [['jobSum', 'DESC']],
  })

  const response = mapProfilesToResponse(profiles)

  res.status(200).json(response.slice(0, limit))
})

module.exports = router
