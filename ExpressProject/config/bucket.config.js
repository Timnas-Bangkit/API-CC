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

const privateBucketConfig= {
  name: process.env.PRIVATE_BUCKET || null,
  key: process.env.BUCKET_PRIVATE_SERVICEACCOUT_KEY || null,
}
if(privateBucketConfig.name){
  privateBucketConfig.cvPath = (process.env.CONTEXT || 'dev') + '/CVs/'
}

const storage2 = new Storage({keyFilename: privateBucketConfig.key});
const privateBucket = storage2.bucket(privateBucketConfig.name);

module.exports = { bucket, bucketConfig, privateBucket, privateBucketConfig};
