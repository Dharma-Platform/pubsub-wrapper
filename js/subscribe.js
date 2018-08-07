const PubSub = require("@google-cloud/pubsub");
const { MINUTE, SECOND } = require("time-constants");
const { listAllTopics, createTopic } = require("./publish");

const listSubscriptions = () => {
  // Instantiates a client
  const pubsub = PubSub();

  // Lists all subscriptions in the current project
  return pubsub.getSubscriptions()
    .then((results) => {
      const subscriptions = results[0];

      console.log("Subscriptions:");
      subscriptions.forEach(subscription => console.log(subscription.name));

      return subscriptions;
    });
};

const listTopicSubscriptions = async (topicName) => {
  const allTopics = await listAllTopics();
  let topic = allTopics.find(t => t.name.split("/").slice(-1).pop() === topicName);
  if (!topic) {
    topic = await createTopic(topicName);
  }
  const results = await topic.getSubscriptions();
  return results[0];
};

const createSubscription = async (topicName, subscriptionName) => {
  const allTopics = await listAllTopics();
  let topic = allTopics.find(t => t.name.split("/").slice(-1).pop() === topicName);
  if (!topic) {
    topic = await createTopic(topicName);
  }
  const results = await topic.createSubscription(subscriptionName);
  return results[0];
};

const listenForMessages = (subscriptionName, messageHandler, timeOut) => {
  const pubsub = PubSub();
  const subscription = pubsub.subscription(subscriptionName);
  let messageCount = 0;
  const defaultMessageHandler = (message) => {
    console.log(`Received message ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);
    messageCount += 1;
    console.log(messageCount);
    message.ack();
  };
  const handler = messageHandler || defaultMessageHandler;
  subscription.on("message", handler);
  if (timeOut) {
    setTimeout(() => {
      subscription.removeListener("message", handler);
      console.log("Stopping Subscription");
    }, timeOut * SECOND);
  }
  subscription.on("error", () => {
    setTimeout(() => {
      subscription.removeListener("message", handler);
      subscription.on("message", handler);
    }, MINUTE);
  });
};

const setupSubscriptionForListening = async (props) => {
  const { topicName, subscriptionName, messageHandler, timeOut } = props;
  let fullTopicName = `${topicName}-${process.env.NODE_ENV || "undefined"}`;
  if ((process.env.NODE_ENV !== "production") || (process.env.POD_NAMESPACE != "live")) {
    fullTopicName = `${fullTopicName}-${process.env.LOGNAME || "undefined"}-${process.env.TRAVIS_BRANCH || "undefined"}-${process.env.POD_NAMESPACE || "undefined"}`;
  }
  const fullSubscriptionName = `${fullTopicName}-${subscriptionName}`;
  const topicSubs = await listTopicSubscriptions(fullTopicName);
  const matchingSubs = topicSubs.filter(topic =>
    topic.name.split("/").slice(-1)[0].toLowerCase() === fullSubscriptionName.toLowerCase());
  if (!matchingSubs.length) {
    await createSubscription(fullTopicName, fullSubscriptionName);
    await listTopicSubscriptions(fullTopicName);
    await listenForMessages(fullSubscriptionName, messageHandler, timeOut);
  } else {
    await listenForMessages(fullSubscriptionName, messageHandler, timeOut);
  }
};

module.exports = {
  listSubscriptions: listSubscriptions,
  listTopicSubscriptions: listTopicSubscriptions,
  createSubscription: createSubscription,
  listenForMessages: listenForMessages,
  setupSubscriptionForListening: setupSubscriptionForListening,
};

