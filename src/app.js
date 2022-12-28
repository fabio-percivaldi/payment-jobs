'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
const { Op } = require('sequelize')

/**
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async(req, res) => {
  const { Contract } = req.app.get('models')
  const { id } = req.params
  const { profile } = req
  const contract = await Contract.findOne({ where: { id, ContractorId: profile.id } })
  if (!contract) { return res.status(404).end() }
  res.json(contract)
})

app.get('/contracts', getProfile, async(req, res) => {
  const { Contract } = req.app.get('models')
  const { profile } = req
  const contract = await Contract.findAll({ where: { ContractorId: profile.id,
    [Op.or]: [
      { status: 'new' },
      { status: 'in_progress' },
    ] } })
  if (!contract) { return res.status(404).end() }
  res.json(contract)
})
module.exports = app
