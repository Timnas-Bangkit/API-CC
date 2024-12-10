const tf = require('@tensorflow/tfjs');

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

module.exports = { loadScoringModel, getScoringModel };
