parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

CA_INGRESS=$(kubectl get ingress -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].spec.rules[0].host}")
CA_POD=$(kubectl get pods -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].metadata.name}")


echo "add ssd "
kubectl apply -f ../extra/ssd.yaml

for NUM in `seq 1 3`;
do
    echo "installing couchDB "
    helm install stable/hlf-couchdb -n cdb-peer${NUM} --namespace peers -f ../helm_values/cdb-peer.yaml
    SLEEP 2

    # check couch
    CDB_POD=$(kubectl get pods -n peers -l "app=hlf-couchdb,release=cdb-peer${NUM}" -o jsonpath="{.items[*].metadata.name}")
    status=1
    while [[ $status != 0 ]]; do 
        kubectl logs -n peers $CDB_POD | grep 'Apache CouchDB has started on'
        status=$?
        if [[ $status != 0 ]]; then 
            SLEEP 10 
        fi
    done
    echo "couchDB ok"


    kubectl exec -n cas $CA_POD -- fabric-ca-client register --id.name peer${NUM} --id.secret peer${NUM}_pw --id.type peer
    FABRIC_CA_CLIENT_HOME=../config fabric-ca-client enroll -d -u https://peer${NUM}:peer${NUM}_pw@$CA_INGRESS -M peer${NUM}_MSP

    NODE_CERT=$(ls ../config/peer${NUM}_MSP/signcerts/*.pem)
    kubectl create secret generic -n peers hlf--peer${NUM}-idcert --from-file=cert.pem=${NODE_CERT}

    NODE_KEY=$(ls ../config/peer${NUM}_MSP/keystore/*_sk)
    kubectl create secret generic -n peers hlf--peer${NUM}-idkey --from-file=key.pem=${NODE_KEY}

    echo "installing hlf-peer"
    eval "echo \"$(sed 's/"/\\"/g' ../template/peer.yaml)\" > ../generated/peer$NUM.yaml"
    helm install stable/hlf-peer -n peer${NUM} --namespace peers -f ../generated/peer${NUM}.yaml
    # # wait fo peer pod
    SLEEP 2
    PEER_POD=$(kubectl get pods -n peers -l "app=hlf-peer,release=peer${NUM}" -o jsonpath="{.items[0].metadata.name}")

    ## check peer
    status=1
    while [[ $status != 0 ]]; do 
        kubectl logs -n peers $PEER_POD | grep 'Starting peer'
        status=$?
        if [[ $status != 0 ]]; then 
            SLEEP 10 
        fi
    done
    echo "Peer ok"

done
