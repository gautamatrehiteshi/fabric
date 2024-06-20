CA_INGRESS=$(kubectl get ingress -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].spec.rules[0].host}")
CA_POD=$(kubectl get pods -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].metadata.name}")

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"


# Org Admin Identities
# should not exist first

# todo check folder
DIR="../config/ord1_MSP"
if [ "$(ls -A $DIR)" ]; then
     echo "config folder is not empty"
     exit 1
fi

DIR="../config/peer1_MSP"
if [ "$(ls -A $DIR)" ]; then
     echo "config folder is not empty"
     exit 1
fi

DIR="../config/PeerMSP"
if [ "$(ls -A $DIR)" ]; then
     echo "config folder is not empty"
     exit 1
fi

DIR="../config/OrdererMSP"
if [ "$(ls -A $DIR)" ]; then
     echo "config folder is not empty"
     exit 1
fi


#order admin 
kubectl exec -n cas $CA_POD -- fabric-ca-client register --id.name ord-admin --id.secret OrdAdm1nPW --id.attrs 'admin=true:ecert'
if [[ $? != 0 ]]; then 
    echo "register ord-admin failed"
    exit 1
fi

#peer admin
kubectl exec -n cas $CA_POD -- fabric-ca-client register --id.name peer-admin --id.secret PeerAdm1nPW --id.attrs 'admin=true:ecert'
if [[ $? != 0 ]]; then 
    echo "register peer-admin failed"
    exit 1
fi

#Orderer Organisation
FABRIC_CA_CLIENT_HOME=../config fabric-ca-client enroll -u https://ord-admin:OrdAdm1nPW@$CA_INGRESS -M ./OrdererMSP
mkdir -p ../config/OrdererMSP/admincerts
cp ../config/OrdererMSP/signcerts/* ../config/OrdererMSP/admincerts

#Peer Organisation
FABRIC_CA_CLIENT_HOME=../config fabric-ca-client enroll -u https://peer-admin:PeerAdm1nPW@$CA_INGRESS -M ./PeerMSP
mkdir -p ../config/PeerMSP/admincerts
cp ../config/PeerMSP/signcerts/* ../config/PeerMSP/admincerts

## TODO : celan  OrdererMSP/keystore and PeerMSP/keystore keystore


# save admin cert
ORG_CERT=$(ls ../config/OrdererMSP/admincerts/cert.pem)
kubectl create secret generic -n orderers hlf--ord-admincert --from-file=cert.pem=$ORG_CERT
if [[ $? != 0 ]]; then 
    echo "fail to create ord-admincert secret"
    exit 1
fi


# save admin key
ORG_KEY=$(ls ../config/OrdererMSP/keystore/*_sk)
kubectl create secret generic -n orderers hlf--ord-adminkey --from-file=key.pem=$ORG_KEY
if [[ $? != 0 ]]; then 
    echo "fail to create ord-adminkey secret"
    exit 1
fi


# save key ca cert
CA_CERT=$(ls ../config/OrdererMSP/cacerts/*.pem)
kubectl create secret generic -n orderers hlf--ord-ca-cert --from-file=cacert.pem=$CA_CERT
if [[ $? != 0 ]]; then 
    echo "fail to create ord-ca-cert secret"
    exit 1
fi

## same for org
ORG_CERT=$(ls ../config/PeerMSP/admincerts/cert.pem)
kubectl create secret generic -n peers hlf--peer-admincert --from-file=cert.pem=$ORG_CERT
if [[ $? != 0 ]]; then 
    echo "fail to create peer-admincert secret"
    exit 1
fi


ORG_KEY=$(ls ../config/PeerMSP/keystore/*_sk)
kubectl create secret generic -n peers hlf--peer-adminkey --from-file=key.pem=$ORG_KEY
if [[ $? != 0 ]]; then 
    echo "fail to create peer-adminkey secret"
    exit 1
fi


CA_CERT=$(ls ../config/PeerMSP/cacerts/*.pem)
kubectl create secret generic -n peers hlf--peer-ca-cert --from-file=cacert.pem=$CA_CERT
if [[ $? != 0 ]]; then 
    echo "fail to create eer-ca-cert secret"
    exit 1
fi


echo "certificat material ok"