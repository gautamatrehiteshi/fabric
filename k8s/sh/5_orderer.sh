CA_INGRESS=$(kubectl get ingress -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].spec.rules[0].host}")
CA_POD=$(kubectl get pods -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].metadata.name}")


helm install incubator/kafka -n kafka-hlf --namespace orderers -f ../helm_values/kafka-hlf.yaml


for NUM in `seq 1 3`;
do
    # register
    kubectl exec -n cas $CA_POD -- fabric-ca-client register --id.name ord${NUM} --id.secret ord${NUM}_pw --id.type orderer
    FABRIC_CA_CLIENT_HOME=../config fabric-ca-client enroll -d -u https://ord${NUM}:ord${NUM}_pw@$CA_INGRESS -M ord${NUM}_MSP

    # save cert
    NODE_CERT=$(ls ../config/ord${NUM}_MSP/signcerts/*.pem)
    kubectl create secret generic -n orderers hlf--ord${NUM}-idcert --from-file=cert.pem=${NODE_CERT}

    #Save the Orderer private key in another secret
    NODE_KEY=$(ls ../config/ord${NUM}_MSP/keystore/*_sk)
    kubectl create secret generic -n orderers hlf--ord${NUM}-idkey --from-file=key.pem=${NODE_KEY}

    # wanrning from external env var
    eval "echo \"$(sed 's/"/\\"/g' ../template/ord.yaml)\" > ../generated/ord$NUM.yaml"
    helm install stable/hlf-ord -n ord$NUM --namespace orderers -f ../generated/ord$NUM.yaml

    SLEEP 2
    ORD_POD=$(kubectl get pods -n orderers -l "app=hlf-ord,release=ord${NUM}" -o jsonpath="{.items[0].metadata.name}")
    status=1
    while [[ $status != 0 ]]; do 
        kubectl logs -n orderers $ORD_POD | grep 'completeInitialization'
        status=$?
        if [[ $status != 0 ]]; then 
            SLEEP 10 
        fi
    done
    
done


