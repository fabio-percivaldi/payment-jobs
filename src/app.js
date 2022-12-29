'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
const contractsRoutes = require('./routes/contracts')
const jobsRoutes = require('./routes/jobs')
const balancesRoutes = require('./routes/balances')

app.use(contractsRoutes)
app.use(jobsRoutes)
app.use(balancesRoutes)

module.exports = app
