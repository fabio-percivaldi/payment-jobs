'use strict'

const tap = require('tap')
const app = require('../src/app')
const bodyParser = require('body-parser')
const request = require('supertest')

app.use(bodyParser.json())

tap.test('testing API', async test => {
  const response = await request(app)
    .get('/contracts/1')
    .set('profile_id', 1)

  test.equal(response.statusCode, 200)
  test.end()
})
