'use strict'

const tap = require('tap')
const app = require('../src/app')
const bodyParser = require('body-parser')
const request = require('supertest')

app.use(bodyParser.json())

tap.test('GET contracts', async test => {
  test.test('200 - return the contract given an id', async assert => {
    const response = await request(app)
      .get('/contracts/1')
      .set('profile_id', 5)

    assert.equal(response.statusCode, 200)
    assert.end()
  })

  test.test('404 - return error for wrong contractor id', async assert => {
    const response = await request(app)
      .get('/contracts/1')
      .set('profile_id', 1)

    assert.equal(response.statusCode, 404)
    assert.end()
  })

  test.test('401 - return error if not profile id is sent', async assert => {
    const response = await request(app)
      .get('/contracts/1')

    assert.equal(response.statusCode, 401)
    assert.end()
  })
  test.end()
})
