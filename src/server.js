'use strict'

const app = require('./app')
const logger = require('pino')()
init()

async function init() {
  try {
    app.listen(3001, () => {
      logger.info('Express App Listening on Port 3001')
    })
  } catch (error) {
    logger.error(`An error occurred: ${JSON.stringify(error)}`)
    throw error
  }
}
