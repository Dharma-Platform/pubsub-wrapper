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
  let nodeEnv = process.env.NODE_ENV;
  if (process.env.POD_NAMESPACE && process.env.POD_NAMESPACE !== "live") {
    nodeEnv = "beta";
  }
  let fullTopicName = `${topicName}-${nodeEnv}`;
  if (nodeEnv !== "production") {
    fullTopicName = `${fullTopicName}-${process.env.LOGNAME}-${process.env.TRAVIS_BRANCH}-${process.env.POD_NAMESPACE}`;
  }
  let topic = allTopics.find(t => t.name.split("/").slice(-1).pop() === fullTopicName);
  if (!topic) {
    topic = await createTopic(fullTopicName);
  }
  const publisher = topic.publisher();
  // Publishes the message as a string to the topic
  const dataBuffer = Buffer.from(JSON.stringify(data));
  try {
    const results = await publisher.publish(dataBuffer);
    const messageId = results[0];
    console.log(`Message ${messageId} published.`);
    return messageId;
  } catch (err) {
    console.log("Message not published.");
    console.error(err);
  }
};

module.exports = {
  listAllTopics: listAllTopics,
  createTopic: createTopic,
  publishMessage: publishMessage,
};
