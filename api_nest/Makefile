#
# Makefile for HyperLedger Fabric Seed
# Flexper, 2019
#

PROJECT_NAME=canb-api-fabric-ibm

GREEN  := $(shell tput -Txterm setaf 2)
WHITE  := $(shell tput -Txterm setaf 7)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)
ARCH   := $(shell uname -m)

.PHONY:start stop clean restart tests stats teardown
start: api ##@Code start a dev environment with the API running

stop: stop-api ##@Environment stop the api environment

clean: stop clean-api ##@Environment clean out temporary files, containers, etc

restart: stop clean start ##@Environment restarts a dev environment

test: build-api test-api stop-api clean-api ##@Code install packages and run tests from a clean environment

teardown: stop clean teardown-api ##@Environment completely remove any containers, images, leftovers on the system

stats: ##@other useful docker stats with formating
	docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.Name}}"

help: ##@other Show this help.
	@perl -e '$(HELP_FUN)' $(MAKEFILE_LIST)

HELP_FUN = \
	%help; \
	while(<>) { push @{$$help{$$2 // 'options'}}, [$$1, $$3] if /^([a-zA-Z\-]+)\s*:.*\#\#(?:@([a-zA-Z\-]+))?\s(.*)$$/ }; \
	print "usage: make [target]\n\n"; \
	for (sort keys %help) { \
		print "${WHITE}$$_:${RESET}\n"; \
		for (@{$$help{$$_}}) { \
			$$sep = " " x (32 - length $$_->[0]); \
			print "  ${YELLOW}$$_->[0]${RESET}$$sep${GREEN}$$_->[1]${RESET}\n"; \
	}; \
	print "\n"; }

.PHONY:build-api test-api stop-api clean-api connect-api teardown-api
build-api:
	docker image build -t $(PROJECT_NAME)/api .
api: build-api
	docker container run -ti \
		--name $(PROJECT_NAME)-api \
		--env-file ./.env.dev \
		-p 4000:4000 \
		-v ${PWD}/data:/data \
		$(PROJECT_NAME)/api \
		yarn start
# --network seed_network 
stop-api:
	-docker stop $(PROJECT_NAME)-api
	-docker rm $$(docker ps -aq --filter "name=$(PROJECT_NAME)-api" --format="{{.ID}}")
teardown-api:
	docker rmi $$(docker ps -aq --filter "name=$(PROJECT_NAME)/api" --format="{{.ID}}")
