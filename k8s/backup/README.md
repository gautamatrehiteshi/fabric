# Launch CronJob for Peer data backup

## Objective
The objective is to backup the data from Fabric Peer into a GCP bucket daily with the tool gcsfuse

## Prereq
* Install A specific Peer for backup, the helm chart can be found in "./k8s/helm_values", a couchDB for backup needs to be launch with the name "cdb-peer-backup"

## Procedure gcsfuse
* Create service account on GCP with `admin storagecloud` role and export JSON key (you'll need it later)
* Create Bucket and name it
* Into ./backup/Dockerfile (gcsfuse Dockerfile) set the name of the GCP bucket newly created and replace the path for the JSON service account key file
* Build and push the image in chosen registry and change the path of the image in the `backup-peer.yaml` cronjob file (you'll potentially need to create a Kubernetes secret in order to access to the registry)

## Procedure Upscale/Downscale chosen deployment
* Create Kubernetes service account with RBAC authorization in the "create_rbac" directory
```
kubectl create -f role.yaml
kubectl create -f serviceaccount.yaml
kubectl create -f rolebinding.yaml
```
* Change env var for python script:
    * `DEPLOYMENT_NAME`: name of the peer deployment
    * `CACERT`: certificate for the service account
    * `TOKEN`: token from the service account
    * `HOST_URL`: 
```
kubectl get secrets

# Set the CACERT env var with the result of this:
kubectl get secrets -n peers <backup-peer-token-xxxx> -o jsonpath="{['data']['ca\.crt']}"

# Set the TOKEN env var with the result of this:
kubectl get secrets -n peers <backup-peer-token-xxxx> -o jsonpath={.data.token} | base64 -D

# Set the HOST_URL env var with the result of this:
kubectl cluster-info | grep 'Kubernetes master' | awk '/http/ {print $NF}'
```
* In order to build image for upscale and downscale change the variable "selected_deploy.spec.replicas = `number of replica`" in the file "downscale_deployment.py" and build/push two images, one for upscale and one for downscale in the selected registry.

* Change the image name in launch-peer.yaml and stop-peer.yaml -> those cronjob will start and stop peer backup pod in order to perform the backup -> `Taking the number of scale in the docker env var can be a good evolution, Unique docker image might be enought for this upscale/downscale step`
