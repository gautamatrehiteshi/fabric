
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

mkdir ../generated

## nop use one from template
echo "installing hyperleder ca"
eval "echo \"$(sed 's/"/\\"/g' ../template/ca.yaml)\" > ../generated/ca.yaml"
helm install stable/hlf-ca -n ca --namespace cas -f ../generated/ca.yaml

SLEEP 20

CA_INGRESS=$(kubectl get ingress -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].spec.rules[0].host}")
CA_POD=$(kubectl get pods -n cas -l "app=hlf-ca,release=ca" -o jsonpath="{.items[0].metadata.name}")

statusIng=1
while [[ $statusIng != 0 ]]; do 
    kubectl logs -n cas $CA_POD | grep "Listening on"
    statusIng=$?
    if [[ $statusIng != 0 ]]; then 
        echo "waiting for ca to be ready"
        SLEEP 10 
    fi
done


# should return empty file
kubectl exec -n cas $CA_POD -- cat /var/hyperledger/fabric-ca/msp/signcerts/cert.pem
if [[ $? == 0 ]]; then 
    echo "certificate already exist"
    exit 1
fi


kubectl exec -n cas $CA_POD -- bash -c 'fabric-ca-client enroll -d -u http://$CA_ADMIN:$CA_PASSWORD@$SERVICE_DNS:7054'
if [[ $? != 0 ]]; then 
    echo "enroll failed"
    exit 1
fi

status=1
while [[ $status != 0 ]]; do 
    curl https://$CA_INGRESS/cainfo
    status=$?
    if [[ $status != 0 ]]; then 
        SLEEP 10 
    fi
done


echo "fabric ca ok"
