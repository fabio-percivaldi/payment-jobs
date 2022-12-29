'use strict'

const {
  Profile,
  Job,
} = require('../src/model')

const removeMetadata = (records) => {
  return records.map(record => {
    delete record.createdAt
    delete record.updatedAt
    return record
  })
}

const depositFunds = async(amount = 1000, profileId) => {
  await Profile.update({ balance: amount }, { where: { id: profileId } })
}

const createUnpaidJob = async(price = 200) => {
  const job = await Job.create({
    description: 'work',
    price,
    ContractId: 4,
  })
  return job.id
}

module.exports = {
  removeMetadata,
  depositFunds,
  createUnpaidJob,
}
