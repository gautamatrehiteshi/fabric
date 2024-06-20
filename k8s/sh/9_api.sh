CHAINCODE_ID="canb-chaincode"
DOCKER_IMG=registry.gitlab.com/flexper/canb/canb-api-fabric:05442f710e5f27dcc3fc5d8d32ca68a02aeae63b
ADMIN_PASS=rbOhOKpIag4Fl9bq9vUE6FuC
STATIC_IP=34.77.52.142
API_HOST=api.preprod.blockchain.canb.eu

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# get admin ca pass
ADMIN_PASS=$(kubectl get secret --namespace cas ca-hlf-ca--ca -o jsonpath="{.data.CA_PASSWORD}" | base64 --decode)

kubens peers

kubectl create secret docker-registry gitlab-secret \
  --docker-server=registry.gitlab.com \
  --docker-username=read-only-all \
  --docker-password=GhKgC33RLzuzQP3z6NTC



for NUM in `seq 1 3`;
do
    #envsubst will not work with shell var
    #envsubst '\$NUM:$ADMIN_PASS:$DOCKER_IMG:$CHAINCODE_ID' < ../template/api.yaml >  ../template/api$NUM.yaml
    # wanrning from external env var
    
    eval "echo \"$(sed 's/"/\\"/g' ../template/api.yaml)\" > ../generated/api$NUM.yaml"
    kubectl create -f ../generated/api$NUM.yaml
done

kubectl create -f ../template/api-service.yaml


eval "echo \"$(sed 's/"/\\"/g' ../template/api-ingress.yaml)\" > ../generated/api-ingress.yaml"
kubectl create -f ../generated/api-ingress.yaml
