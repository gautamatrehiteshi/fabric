# Makefile for HyperLedger Fabric $(PROJECT_NAME)
include .env

GREEN  := $(shell tput -Txterm setaf 2)
WHITE  := $(shell tput -Txterm setaf 7)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)
ARCH   := $(shell uname -m)

COMPOSE = docker-compose --env-file .env -f docker-compose.yml -p ${PROJECT_NAME}

.PHONY: playground start stop clean restart tests stats teardown
start: build fabric ##@Environment start a dev environment, generate crypto certificates for fabric then starts fabric

stop: stop-fabric ##@Environment stop the fabric blockchain and dev environment

clean: clean-fabric clean-api ##@Environment clean out temporary files, containers, etc

restart: stop clean start ##@Environment restarts a dev environment

test: test-gql ##@Environment Run unit tests

teardown: stop clean teardown-fabric teardown-dev teardown-api ##@Setup completely remove any containers, images, leftovers on the system

deploy: deploy-api deploy-fabric ##@Setup package and deploy the architecture images

stats: ##@Other useful docker stats with formating
	docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.Name}}"

help2:
	@grep '.*: .* #' Makefile | sed 's/\(.*\): \(.*\) #\(.*\)/\1 \3/' | expand -t40
help: ##@Other Show this help.
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

### development environment to run and test business network without the need to install anything locally ###
.PHONY:dev install-dev test-dev stop-dev build-dev connect-dev teardown-dev
# dev environment lifecycle
install-dev:
	docker exec -t $(PROJECT_NAME) bash -c "npm install --prefix $(PROJECT_NAME)/"
test-dev:
	docker exec -t $(PROJECT_NAME) bash -c "npm run test --prefix $(PROJECT_NAME)/"
build:
	$(COMPOSE) build
# docker image build -t $(REGISTRY)/$(PROJECT_NAME):$(VERSION) .

connect-dev:
	docker exec -it $(PROJECT_NAME) bash
teardown-dev:
	-docker rmi $(REGISTRY)/$(PROJECT_NAME)

##################
###   Fabric   ###
##################
### Packaging operations ###
deploy-fabric: build-architecture deploy-builder
build-architecture:
	docker build -t $(REGISTRY)/builder:$(FABRIC_VERSION) ./architecture
	docker image tag $(REGISTRY)/builder:$(FABRIC_VERSION) $(REGISTRY)/builder:latest
deploy-builder:
	docker push $(REGISTRY)/builder:$(FABRIC_VERSION)
	docker push $(REGISTRY)/builder:latest

### Docker-compose options for local operations ###
fabric:
	$(COMPOSE) up builder
	make install v=1
stop-fabric:
	$(COMPOSE) run builder make stop
clean-fabric:
	-docker stop $$(docker ps -aq --filter "name=dev-peer*$(PROJECT_NAME)-*")
	-docker rm $$(docker ps -aq --filter "name=dev-peer*")
	-docker rmi $$(docker images -aq --filter "reference=dev-peer*")
	-docker system prune -f

teardown-fabric: clean-fabric
	-docker rmi $$(docker images -aq --filter "reference=hyperledger/fabric-*:1.2.1")
	-docker rmi $$(docker images -aq --filter "reference=hyperledger/fabric-*:0.4.10")

copy-chaincode:
	docker cp $(PWD)/sample_chaincode cli.$(PROJECT_NAME):/var/hyperledger/$(PROJECT_NAME)-$(v)

install: copy-chaincode ##@Code install and instantiate fabric chaincode. ex: make install v=2
	$(COMPOSE) run builder make install VERSION=$(v)

upgrade: copy-chaincode ##@Code install and instantiate fabric chaincode update. ex: make upgrade v=2
	$(COMPOSE) run builder make upgrade VERSION=$(v)


##################
###    APIs    ###
##################
.PHONY: api stop-api clean-api

### Packaging operations ###
deploy-api: build-api deploy-api
build-api:
	docker build -t $(REGISTRY)/api:$(FABRIC_API_TAG)-$(FABRIC_VERSION) ./api_graphql
	docker image tag $(REGISTRY)/api:$(FABRIC_API_TAG)-$(FABRIC_VERSION) $(REGISTRY)/api:$(FABRIC_API_TAG)
	docker image tag $(REGISTRY)/api:$(FABRIC_API_TAG)-$(FABRIC_VERSION) $(REGISTRY)/api:latest
deploy-api:
	docker push $(REGISTRY)/api:$(FABRIC_API_TAG)-$(FABRIC_VERSION)
	docker push $(REGISTRY)/api:$(FABRIC_API_TAG)
	docker push $(REGISTRY)/api:latest

api: api-gql
stop-api: stop-nest stop-gql
clean-api: clean-gql
api-test: api-gql-test

# api nest
api-nest: build-nest
	$(COMPOSE) up api.nest
build-nest:
	echo "building nest => TODO"
# $(COMPOSE) build api.nest
stop-nest:
	echo "Stopping nest => TODO"
clean-nest:
	-rm -rf ./data/api.nest/*

# api graphQL
build-gql:
	$(COMPOSE) build api.gql
api-gql: build-gql
	$(COMPOSE) up api.gql
stop-gql:
	echo "Stopping gql => TODO"
clean-gql:
	-rm -rf ./data/api.gql/*
test-gql: build-gql
	$(COMPOSE) run api.gql yarn test
