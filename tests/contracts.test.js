'use strict'

const tap = require('tap')
const app = require('../src/app')
const bodyParser = require('body-parser')
const request = require('supertest')
const {
  removeMetadata,
} = require('./utils')

app.use(bodyParser.json())

// warning: this is an in place operation


tap.test('GET /contracts/:id by id', async test => {
  test.test('200 - return the contract given an id', async assert => {
    const expectedBody = {
      id: 1,
      terms: 'bla bla bla',
      status: 'terminated',
      ContractorId: 5,
      ClientId: 1,
    }
    const response = await request(app)
      .get('/contracts/1')
      .set('profile_id', 5)

    assert.equal(response.statusCode, 200)
    assert.strictSame(...removeMetadata([response.body]), expectedBody)
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

tap.test('GET /contracts', async test => {
  test.test('200 - return the list of contracts given a profile id', async assert => {
    const expectedBody = [
      {
        id: 2,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: 1,
        ContractorId: 6,
      },
      {
        id: 3,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: 2,
        ContractorId: 6,
      },
      {
        id: 8,
        terms: 'bla bla bla',
        status: 'in_progress',
        ContractorId: 6,
        ClientId: 4,
      },
    ]

    const response = await request(app)
      .get('/contracts')
      .set('profile_id', 6)

    assert.equal(response.statusCode, 200)
    assert.strictSame(removeMetadata(response.body), expectedBody)
    assert.end()
  })

  test.test('200 - return the list of contracts given a profile id, only non terminated', async assert => {
    const expectedBody = []

    const response = await request(app)
      .get('/contracts')
      .set('profile_id', 5)

    assert.equal(response.statusCode, 200)
    assert.strictSame(removeMetadata(response.body), expectedBody)
    assert.end()
  })
  test.end()
})
