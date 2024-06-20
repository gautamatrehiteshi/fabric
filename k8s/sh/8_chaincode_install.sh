VNUMBER="0.2.10"
CHAINCODE_NAME="canb-chaincode"
CHANNEL_NAME=mychannel
PROJECT=canb-chaincode
REPO=gitlab.com/flexper/canb/$PROJECT.git

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

kubens peers

for NUM in `seq 1 3`;
do
    PEER_POD=$(kubectl get pods -n peers -l "app=hlf-peer,release=peer${NUM}" -o jsonpath="{.items[0].metadata.name}")
    kubectl cp ./chaincode-pod_update.sh $PEER_POD:chaincode-pod_update.sh 
    kubectl exec -it -n peers $PEER_POD -- bash chaincode-pod_update.sh -v $VNUMBER -c $CHAINCODE_NAME -r $REPO -p $PROJECT

    if [[ $NUM == 1 ]]; then 
        kubectl cp ./chaincode-pod_upgrade.sh $PEER_POD:chaincode-pod_upgrade.sh 
        kubectl exec -it -n peers $PEER_POD -- bash chaincode-pod_upgrade.sh -v $VNUMBER -c $CHAINCODE_NAME -r $REPO -p $PROJECT -m i
    fi

done








