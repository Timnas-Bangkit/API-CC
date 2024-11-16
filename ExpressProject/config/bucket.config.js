const { Storage } = require('@google-cloud/storage');
const bucketConfig = {
  name: 'findup',
  url: 'gs://findup',
  picPath: (process.env.CONTEXT || 'dev') + '/public/profile-pic/',
  key: process.env.SERVICEACCOUNT_KEY || null
}

const storage = new Storage({ keyFilename: bucketConfig.key });
const bucket = storage.bucket(bucketConfig.name);

module.exports = { bucket, bucketConfig };
