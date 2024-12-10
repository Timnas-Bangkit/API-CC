const tf = require('@tensorflow/tfjs');
const { DataTypes } = require('sequelize');

let scoring = null;

const loadScoringModel = async () => {
  try {
    // TODO cache it from disk
    scoring = await tf.loadGraphModel(process.env.MODEL_URL1);
  } catch (error) {
    console.log(error);
    model = null;    
  } finally {
    // TODO write cache
  }
}
const getScoringModel = () => {
  if(scoring){
    return scoring;
  }else{
    console.log("model not yet loaded");
    return null;
  }
}

const predictScore = async (input) => {
  return (await scoring.predict({
    input_ids: tf.expandDims(tf.tensor1d(input.input_ids, 'int32')),
    attention_mask: tf.expandDims(tf.tensor1d(input.attention_mask, 'int32')),
    numerical_features: tf.expandDims(tf.tensor1d(input.numerical_features)),
  }).data())[0];
}

module.exports = { loadScoringModel, getScoringModel, predictScore };
