import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="pubsub",
    version="1.0.0",
    author="DharmaPlatform",
    author_email="engineering@dharma.ai",
    description="Pubsub Wrapper",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Dharma-Platform/pubsub-wrapper",
    packages=setuptools.find_packages(),
    classifiers=[
        "Operating System :: OS Independent",
    ],
)