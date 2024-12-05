const { PredictionServiceClient, helpers } = require('@google-cloud/aiplatform');
const { logger } = require('../utils/logger');
const vertexPredictionClient = new PredictionServiceClient({
  keyFilename: (process.env.VERTEX_KEY || undefined), 
  apiEndpoint: 'asia-southeast2-aiplatform.googleapis.com'});

const getCvScore = async (input) => {
  const endpoint = `projects/${process.env.PROJECT_ID}/locations/asia-southeast2/endpoints/${process.env.ENDPOINT1}`;
  const payload = [helpers.toValue(input)];
  const request = {
    endpoint: endpoint,
    instances: payload,
  };

  return new Promise(async (resolve, reject) => {

    await vertexPredictionClient.predict(request).then((res) => {
      return resolve(res);
    }).catch((err) => {
      logger.error("[VERTEX] prediction failed. err: " + err);
      return reject(err);
    })
  });
}

module.exports = { getCvScore };
