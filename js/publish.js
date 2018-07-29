const PubSub = require("@google-cloud/pubsub");


const listAllTopics = async () => {
  const pubsub = PubSub();
  // Lists all Pub/Sub topics in the current project
  return (await pubsub.getTopics())[0];
};

const createTopic = async (topicName) => {
  const pubsub = PubSub();
  // Creates a new Pub/Sub topic
  const topic = (await pubsub.createTopic(topicName))[0];
  console.log(`Topic ${topic.name} created.`);
  return topic;
};

const publishMessage = async (topicName, data) => {
  const allTopics = await listAllTopics();
  let fullTopicName = `${topicName}-${process.env.NODE_ENV}`;
  if (process.env.NODE_ENV !== "production") {
    fullTopicName = `${fullTopicName}-${process.env.LOGNAME}-${process.env.TRAVIS_BRANCH}-${process.env.POD_NAMESPACE}`;
  }
  let topic = allTopics.find(t => t.name.split("/").slice(-1).pop() === fullTopicName);
  if (!topic) {
    topic = await createTopic(fullTopicName);
  }
  const publisher = topic.publisher();
  // Publishes the message as a string to the topic
  const dataBuffer = Buffer.from(JSON.stringify(data));
  return publisher.publish(dataBuffer)
    .then((results) => {
      const messageId = results[0];
      console.log(`Message ${messageId} published.`);
      return messageId;
    });
};

module.exports = {
  listAllTopics: listAllTopics,
  createTopic: createTopic,
  publishMessage: publishMessage,
};
