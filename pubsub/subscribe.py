from .publish import list_topics, create_topic
import os
import sys
import logging

from google.cloud import pubsub_v1  # noqa E402

TESTING = sys.argv[1:2] == ['test']


def list_subscriptions_in_topic(project, topic_name):
    """Lists all subscriptions for a given topic."""
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project, topic_name)
    return [subscription for subscription in subscriber.list_subscriptions(topic_path)]


def list_subscriptions_in_project(project):
    """Lists all subscriptions in the current project."""
    subscriber = pubsub_v1.SubscriberClient()
    project_path = subscriber.project_path(project)
    return [subscription for subscription in subscriber.list_subscriptions(project_path)]


def create_subscription(project, topic_name, subscription_name):
    """Create a new pull subscription on the given topic."""
    subscriber = pubsub_v1.SubscriberClient()
    topics = list_topics(project)
    if len([topic for topic in topics if topic.name.split('/')[-1] == topic_name]) == 0:
        create_topic(project, topic_name)
    topic_path = subscriber.topic_path(project, topic_name)
    subscription_path = subscriber.subscription_path(
        project, subscription_name)
    subscription = subscriber.create_subscription(
        subscription_path, topic_path)

    logging.info('Subscription created: {}'.format(subscription))


def listen_for_messages(project, subscription_name, callback=None):
    """Receives messages from a pull subscription."""
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(
        project, subscription_name)

    def default_callback(message):
        logging.info('Received message: {}'.format(message))
        message.ack()
    if callback is None:
        callback = default_callback
    logging.info(subscription_path)
    subscription = subscriber.subscribe(subscription_path)
    future = subscription.open(callback)
    return (future, subscription)


def setup_subscription_for_listening(topic_name, subscription_name, callback=None):
    """Setup subscription process"""
    if TESTING:
        return
    project = os.getenv('GCLOUD_PROJECT', 'undefined')
    full_topic_name = topic_name + '-' + os.getenv('ENV', 'development')
    if os.getenv('ENV', 'development') != 'production':
        full_topic_name += ('-' + os.getenv('LOGNAME', 'undefined') + '-' +
                            os.getenv('TRAVIS_BRANCH', 'undefined') + '-' +
                            os.getenv('POD_NAMESPACE', 'undefined'))
    full_subscription_name = full_topic_name + '-' + subscription_name
    subscriptions = list_subscriptions_in_project(project)
    if len([subscription for subscription in subscriptions
            if subscription.name.split('/')[-1] == full_subscription_name]) == 0:
        create_subscription(project, full_topic_name, full_subscription_name)
    return listen_for_messages(project, full_subscription_name, callback)
