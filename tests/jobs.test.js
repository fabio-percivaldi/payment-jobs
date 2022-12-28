'use strict'

const tap = require('tap')
const app = require('../src/app')
const bodyParser = require('body-parser')
const request = require('supertest')
const { Job, Profile } = require('../src/model')

app.use(bodyParser.json())

tap.test('GET /jobs/unpaid by id', async test => {
  test.test('200 - return the list of upaid jobs given a client id', async assert => {
    // TODO change the check on createdAt and updatedAt
    const expectedBody = [{
      id: 2,
      description: 'work',
      price: 201,
      paid: null,
      paymentDate: null,
      ContractId: 2,
      createdAt: '2022-12-28T16:22:19.621Z',
      updatedAt: '2022-12-28T16:22:19.621Z',
    }]

    const response = await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', 1)

    assert.equal(response.statusCode, 200)
    assert.strictSame(response.body, expectedBody)
    assert.end()
  })

  test.test('200 - return the list of upaid jobs given a contractor id', async assert => {
    // TODO change the check on createdAt and updatedAt
    const expectedBody = [{
      id: 2,
      description: 'work',
      price: 201,
      paid: null,
      paymentDate: null,
      ContractId: 2,
      createdAt: '2022-12-28T16:22:19.621Z',
      updatedAt: '2022-12-28T16:22:19.621Z',
    },
    {
      id: 3,
      description: 'work',
      price: 202,
      paid: null,
      paymentDate: null,
      createdAt: '2022-12-28T16:22:19.621Z',
      updatedAt: '2022-12-28T16:22:19.621Z',
      ContractId: 3,
    }]

    const response = await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', 6)

    assert.equal(response.statusCode, 200)
    assert.strictSame(response.body, expectedBody)
    assert.end()
  })

  test.end()
})

const createUnpaidJob = async() => {
  const job = await Job.create({
    description: 'work',
    price: 200,
    ContractId: 2,
  })
  return job.id
}

const depositFunds = async() => {
  await Profile.update({ balance: 1000 }, { id: 1 })
}

tap.test('POST /jobs/:job_id/pay a job', async test => {
  const jobId = await createUnpaidJob()
  await depositFunds()

  test.test('200 - balance is > than pay amount', async assert => {
    const response = await request(app)
      .post(`/jobs/${jobId}/pay`)
      .set('profile_id', 1)

    assert.equal(response.statusCode, 200)

    const profile = Profile.findOne({ where: { id: 1 } })
    assert.equal(profile.balance, 800)
    assert.end()
  })

  test.end()
})

