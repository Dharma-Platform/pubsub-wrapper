import os
import sys
import threading
import time
import logging

from google.cloud import pubsub_v1  # noqa E402

TESTING = sys.argv[1:2] == ['test']


def list_topics(project):
    """Lists all Pub/Sub topics in the given project."""
    publisher = pubsub_v1.PublisherClient()
    project_path = publisher.project_path(project)
    return publisher.list_topics(project_path)


def create_topic(project, topic_name):
    """Create a new Pub/Sub topic."""
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project, topic_name)
    topic = publisher.create_topic(topic_path)
    logging.info('Topic created: {}'.format(topic))


def publish_message_async(topic_name, message):
    """Publishes multiple messages to a Pub/Sub topic."""
    if TESTING:
        return
    publisher = pubsub_v1.PublisherClient()
    project = os.getenv('GCLOUD_PROJECT', 'undefined')
    topics = list_topics(project)
    full_topic_name = topic_name + '-' + os.getenv('ENV', 'development')
    if os.getenv('ENV', 'development') != 'production':
        full_topic_name += ('-' + os.getenv('LOGNAME', 'undefined') + '-' +
                            os.getenv('TRAVIS_BRANCH', 'undefined') + '-' +
                            os.getenv('POD_NAMESPACE', 'undefined'))
    if len([topic for topic in topics if topic.name.split('/')[-1] == full_topic_name]) == 0:
        create_topic(project, full_topic_name)
    topic_path = publisher.topic_path(project, full_topic_name)
    data = str(message).encode('utf-8')
    try:
        publisher.publish(topic_path, data=data)
    except:
        time.sleep(60)
        publish_message(topic_name, message)


def publish_message(topic_name, message):
    msg_thread = threading.Thread(target=publish_message_async, args=(topic_name, message))
    msg_thread.start()
