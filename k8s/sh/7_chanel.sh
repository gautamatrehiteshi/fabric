parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"


CA_INGRESS=$(kubectl get ingress -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].spec.rules[0].host}")
CA_POD=$(kubectl get pods -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].metadata.name}")


for NUM in `seq 1 3`;
do
    PEER_POD=$(kubectl get pods -n peers -l "app=hlf-peer,release=peer${NUM}" -o jsonpath="{.items[0].metadata.name}")

    # only 1st peer create the channel 
    if [[ $NUM == 1 ]]; then 
        kubectl exec -n peers $PEER_POD -- peer channel create -o ord1-hlf-ord.orderers.svc.cluster.local:7050 -c mychannel -f /hl_config/channel/hlf--channel/mychannel.tx    
    fi
    
    kubectl exec -n peers $PEER_POD -- peer channel fetch config /var/hyperledger/mychannel.block -c mychannel -o ord1-hlf-ord.orderers.svc.cluster.local:7050
    kubectl exec -n peers $PEER_POD -- bash -c 'CORE_PEER_MSPCONFIGPATH=$ADMIN_MSP_PATH peer channel join -b /var/hyperledger/mychannel.block'
    
done
