# What is this repository? #
It is used to create a local instance of a Hyperledger Fabric blockchain.

# What do I need ? #
 - docker

# How to use it ? #
In order to launch the fabric blockchain with chaincode you need to clone this repository:
```
git clone https://gitlab.com/flexper/internal/blockchain/fabric/fabric-architecture-seed.git
```

example of `make start`:
```
USERNAME=********** PASSWORD=************ GITLAB_TOKEN=gitlab+*********** GITLAB_PWD=************* GITLAB_REPO=flexper/<project> make start
```

* `make start`.
You need to pass some variable as arguments to `make start`:
 * USERNAME=`your gitlab login`
 * PASSWORD=`your gitlab password`
 * GITLAB_TOKEN=`name of the access token`
 * GITLAB_PWD=`key of the access token`
 * GITLAB_REPO=`path pf the repo (ex: "flexper/<path to the repo>")`



* `make stop` stop the fabric dev environment
* `make clean` clean out temporary files, containers, etc
* `make restart` restart from a fresh environment (useful to prevent side effects), **you need to use all the variable used for** `make start`
* `make test` run unit tests if present
* `make stats` provide informations on currently running docker containers
* `make teardown` completely remove any containers, images, leftovers on the system

# How to update the image
When update this repository, you'll want to also update the image (no CI yet).
 - Build the image:
```shell
docker build -t registry.gitlab.com/flexper/internal/blockchain/fabric/fabric-architecture-seed/fabric-builder:{x.x.x} .
```
 - And then deploy it on flexper's registry:
 ```shell
docker push registry.gitlab.com/flexper/internal/blockchain/fabric/fabric-architecture-seed/fabric-builder:{x.x.x}
```

## For a more hands-on approach, consult the Makefile. ##
