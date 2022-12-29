'use strict'

const tap = require('tap')
const app = require('../src/app')
const bodyParser = require('body-parser')
const request = require('supertest')
const { Job, Profile } = require('../src/model')

app.use(bodyParser.json())
// warning: this is an in place operation
const removeMetadata = (records) => {
  return records.map(record => {
    delete record.createdAt
    delete record.updatedAt
    return record
  })
}

tap.test('GET /jobs/unpaid by id', async test => {
  test.test('200 - return the list of unpaid jobs given a client id', async assert => {
    const expectedBody = [{
      id: 2,
      description: 'work',
      price: 201,
      paid: null,
      paymentDate: null,
      ContractId: 2,
    }]

    const response = await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', 1)

    assert.equal(response.statusCode, 200)
    assert.strictSame(removeMetadata(response.body), expectedBody)
    assert.end()
  })

  test.test('200 - return the list of unpaid jobs given a contractor id', async assert => {
    const expectedBody = [{
      id: 2,
      description: 'work',
      price: 201,
      paid: null,
      paymentDate: null,
      ContractId: 2,
    },
    {
      id: 3,
      description: 'work',
      price: 202,
      paid: null,
      paymentDate: null,
      ContractId: 3,
    }]

    const response = await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', 6)

    assert.equal(response.statusCode, 200)
    assert.strictSame(removeMetadata(response.body), expectedBody)
    assert.end()
  })

  test.end()
})

const createUnpaidJob = async(price = 200) => {
  const job = await Job.create({
    description: 'work',
    price,
    ContractId: 4,
  })
  return job.id
}

const depositFunds = async(amount = 1000) => {
  await Profile.update({ balance: amount }, { where: { id: 2 } })
}

tap.test('POST /jobs/:job_id/pay a job', async test => {
  test.test('201 - balance is > than pay amount', async assert => {
    const jobId = await createUnpaidJob()
    await depositFunds()

    const response = await request(app)
      .post(`/jobs/${jobId}/pay`)
      .set('profile_id', 2)

    assert.equal(response.statusCode, 201)

    const profile = await Profile.findOne({ where: { id: 2 } })
    assert.equal(profile.balance, 800)
    assert.end()
  })

  test.test('400 - balance is < than pay amount', async assert => {
    const jobId = await createUnpaidJob()
    await depositFunds(100)

    const response = await request(app)
      .post(`/jobs/${jobId}/pay`)
      .set('profile_id', 2)

    assert.equal(response.statusCode, 400)

    const profile = await Profile.findOne({ where: { id: 2 } })
    assert.equal(profile.balance, 100)
    assert.end()
  })

  test.test('201 - two concurrent payment are made but only one is performed', async assert => {
    const jobId = await createUnpaidJob()
    await depositFunds(300)

    const responses = await Promise.all([request(app)
      .post(`/jobs/${jobId}/pay`)
      .set('profile_id', 2),
    request(app)
      .post(`/jobs/${jobId}/pay`)
      .set('profile_id', 2)])

    assert.equal(responses[0].statusCode, 201)
    assert.equal(responses[1].statusCode, 500)

    const profile = await Profile.findOne({ where: { id: 2 } })
    assert.equal(profile.balance, 100)
    assert.end()
  })

  test.end()
})

