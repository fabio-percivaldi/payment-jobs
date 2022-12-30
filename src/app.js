'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const app = express()
const swaggerUi = require('swagger-ui-express')

const contractsRoutes = require('./routes/contracts')
const jobsRoutes = require('./routes/jobs')
const balancesRoutes = require('./routes/balances')
const adminRoutes = require('./routes/admin')
const swaggerDocument = require('./swagger.json')


app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
app.use(contractsRoutes)
app.use(jobsRoutes)
app.use(balancesRoutes)
app.use(adminRoutes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

module.exports = app
