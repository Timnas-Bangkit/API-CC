const { PubSub } = require('@google-cloud/pubsub');

const cvparsing = {
  pubsubTopic: 'topic-cv-parsing-done',
  pubsubSubs: 'topic-cv-parsing-done-sub',
  pubsub: new PubSub({keyFilename: process.env.PUBSUB_CV_PARSING_KEY || null}),
}

module.exports = { cvparsing };
