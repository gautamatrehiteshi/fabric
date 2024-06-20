CA_INGRESS=$(kubectl get ingress -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].spec.rules[0].host}")
CA_POD=$(kubectl get pods -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].metadata.name}")
CHANNEL_NAME=mychannel

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

cd ../config


if [ "$(find ./genesis.block)" ]; then
     echo "genesis block already exist"
     exit 1
fi

if [ "$(find ./mychannel.block)" ]; then
     echo "chanel already empty"
     exit 1
fi


configtxgen -profile OrdererGenesis -outputBlock ./genesis.block
configtxgen -profile MyChannel -channelID $CHANNEL_NAME -outputCreateChannelTx ./mychannel.tx

kubectl create secret generic -n orderers hlf--genesis --from-file=genesis.block
if [[ $? != 0 ]]; then 
    echo "fail to create generic secret"
    exit 1
fi
kubectl create secret generic -n peers hlf--channel --from-file=mychannel.tx
if [[ $? != 0 ]]; then 
    echo "fail to create channel secret"
    exit 1
fi

echo "genesis + chan ok"