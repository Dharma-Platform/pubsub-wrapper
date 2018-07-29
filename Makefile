#
# Makefile for pubsub.
#

YARN := $(shell command -v yarn 2>/dev/null)
ifndef YARN
  $(error yarn not available. Please see https://yarnpkg.com/en/docs/install for installation instructions.)
endif

JEST := $(shell yarn bin)/jest

# Use the GNU versions of tools on OS X for compatibility. Homebrew installs them as gcp, gmkdir, etc.
ifeq "$(shell uname)" "Darwin"
	TOOL_PREFIX := g
endif
RM := $(TOOL_PREFIX)rm

test:
	$(JEST) --runInBand --verbose

pack: install clear

install: 
	$(YARN) install --force

lint:
	../../tools/quality/lint/eslint ./js/
	../../tools/quality/lint/flake8 ./python/

clear:
	$(RM) --recursive --force --verbose node_modules/

ci: lint test
