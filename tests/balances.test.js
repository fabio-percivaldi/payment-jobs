'use strict'


const tap = require('tap')
const app = require('../src/app')
const bodyParser = require('body-parser')
const request = require('supertest')
const {
  Profile,
} = require('../src/model')
const {
  depositFunds,
} = require('./utils')

app.use(bodyParser.json())


tap.test('POST /balances/deposit/:userId', async test => {
  test.test('201 - balance is updated', async assert => {
    await depositFunds(200, 1)

    const response = await request(app)
      .post('/balances/deposit/1')
      .set('profile_id', 1)
      .send({ amount: 24 })

    assert.equal(response.statusCode, 204)

    const profile = await Profile.findOne({ where: { id: 1 } })
    assert.equal(profile.balance, 224)
    assert.end()
  })

  test.end()
})

