'use strict'


const tap = require('tap')
const app = require('../src/app')
const bodyParser = require('body-parser')
const request = require('supertest')
const seed = require('../scripts/seedDb')

app.use(bodyParser.json())

tap.test('GET /admin/best-profession?start=<date>&end=<date>', async test => {
  await seed()
  test.test('200 - return the best profession', async assert => {
    const expectedBody = {
      profession: 'Programmer',
      sum: 2683,
    }
    const response = await request(app)
      .get('/admin/best-profession?start=2015-01-01T00:00:00.000Z&end=2022-12-31T00:00:00.000Z')
      .set('profile_id', 1)

    assert.equal(response.statusCode, 200)
    assert.strictSame(response.body, expectedBody)

    assert.end()
  })

  test.test('200 - return the best profession for a smaller range', async assert => {
    const expectedBody = {
      profession: 'Programmer',
      sum: 2362,
    }
    const response = await request(app)
      .get('/admin/best-profession?start=2020-08-15T17:11:26.737Z&end=2020-08-16T19:11:26.737Z')
      .set('profile_id', 1)

    assert.equal(response.statusCode, 200)
    assert.strictSame(response.body, expectedBody)

    assert.end()
  })

  test.test('400 - using invalid date', async assert => {
    const response = await request(app)
      .get('/admin/best-profession?start=2020-15-01T17:11:26.737Z&end=2020-08-16T19:11:26.737Z')
      .set('profile_id', 1)

    assert.equal(response.statusCode, 400)

    assert.end()
  })

  test.end()
})

tap.test('GET /admin/best-clients?start=<date>&end=<date>&limit=<integer>', async test => {
  await seed()

  test.test('200 - return the first 2 most paying clients if not limit is sent', async assert => {
    const expectedBody = [{
      client: 4,
      sum: 2020,
    }, {
      client: 2,
      sum: 442,
    }]

    const response = await request(app)
      .get('/admin/best-clients?start=2015-01-01T00:00:00.000Z&end=2022-12-31T00:00:00.000Z')
      .set('profile_id', 1)

    assert.equal(response.statusCode, 200)
    assert.strictSame(response.body, expectedBody)

    assert.end()
  })


  test.test('200 - return the first 3 most paying clients', async assert => {
    const expectedBody = [{
      client: 4,
      sum: 2020,
    }, {
      client: 2,
      sum: 442,
    },
    {
      client: 1,
      sum: 221,
    }]

    const response = await request(app)
      .get('/admin/best-clients?start=2015-01-01T00:00:00.000Z&end=2022-12-31T00:00:00.000Z&limit=3')
      .set('profile_id', 1)

    assert.equal(response.statusCode, 200)
    assert.strictSame(response.body, expectedBody)

    assert.end()
  })

  test.end()
})

