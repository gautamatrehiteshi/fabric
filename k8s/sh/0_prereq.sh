parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"


## init helm 
kubectl create serviceaccount --namespace kube-system tiller && kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller && helm init --service-account tiller --upgrade && kubectl patch deploy --namespace kube-system tiller-deploy -p '{"spec":{"template":{"spec":{"serviceAccount":"tiller"}}}}' 


if [ "$(helm ls | grep nginx-ingress)" ]; then 
    echo "nginx-ingress ok"
else
    helm install stable/nginx-ingress --name nginx-ingress --set rbac.create=true
fi


if [ "$(helm ls | grep cert-manager)" ]; then 
    echo "cert-manager ok"
else
    helm install --name cert-manager --namespace cert-manager jetstack/cert-manager
fi


kubectl create -f ../extra/certManagerCI_production.yaml
kubectl create -f ../extra/ssd.yaml
