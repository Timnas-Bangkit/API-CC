const { Storage } = require('@google-cloud/storage');
const bucketConfig = {
  name: 'findup-public',
  url: 'gs://findup-public',
  picPath: (process.env.CONTEXT || 'dev') + '/profile-pic/',
  postPath: (process.env.CONTEXT || 'dev') + '/post/',
  key: process.env.SERVICEACCOUNT_KEY || null
}

const storage = new Storage({ keyFilename: bucketConfig.key });
const bucket = storage.bucket(bucketConfig.name);

module.exports = { bucket, bucketConfig };
