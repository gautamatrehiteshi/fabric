parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

CA_INGRESS=$(kubectl get ingress -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].spec.rules[0].host}")
CA_POD=$(kubectl get pods -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].metadata.name}")


for NUM in `seq 4 6`;
do
    kubectl exec -n cas $CA_POD -- fabric-ca-client register --id.name peer${NUM} --id.secret peer${NUM}_pw --id.type peer
    FABRIC_CA_CLIENT_HOME=../config fabric-ca-client enroll -d -u https://peer${NUM}:peer${NUM}_pw@$CA_INGRESS -M peer${NUM}_MSP

    NODE_CERT=$(ls ../config/peer${NUM}_MSP/signcerts/*.pem)
    kubectl create secret generic -n peers hlf--peer${NUM}-idcert --from-file=cert.pem=${NODE_CERT}

    NODE_KEY=$(ls ../config/peer${NUM}_MSP/keystore/*_sk)
    kubectl create secret generic -n peers hlf--peer${NUM}-idkey --from-file=key.pem=${NODE_KEY}

done



