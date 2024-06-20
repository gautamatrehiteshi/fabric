VNUMBER="0.2.10" # use for chaincode install
CHAINCODE_NAME="canb-chaincode" # use for instanciate and install
CHANNEL_NAME=mychannel # for chaincode upgrade
PROJECT=canb-chaincode
REPO=gitlab.com/flexper/canb/$PROJECT.git

# relative path as SH folder
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# go to the correct k8s namespaces
kubens peers

# Update chaincode on each peer
for NUM in `seq 1 3`;
do
    PEER_POD=$(kubectl get pods -n peers -l "app=hlf-peer,release=peer${NUM}" -o jsonpath="{.items[0].metadata.name}")
    kubectl cp ./chaincode-pod_update.sh $PEER_POD:chaincode-pod_update.sh 
    kubectl exec -it -n peers $PEER_POD -- bash chaincode-pod_update.sh -v $VNUMBER -c $CHAINCODE_NAME -r $REPO -p $PROJECT

    if [[ $NUM == 3 ]]; then 
        ### Instantiate on the chosen Network (channel)
        kubectl cp ./chaincode-pod_upgrade.sh $PEER_POD:chaincode-pod_upgrade.sh 
        kubectl exec -it -n peers $PEER_POD -- bash chaincode-pod_upgrade.sh -v $VNUMBER -c $CHAINCODE_NAME -r $REPO -p $PROJECT
    fi


    # Update associate api docker images
    # Will not works given that it's the same volume attached
    #kubectl set image deployment/api-peer$NUM api-peer=$API_DOCKER_IMAGE

done








