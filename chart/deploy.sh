#!/bin/bash -x
mkdir -p /root/.kube/
echo "$K8S_CONFIG" > /root/.kube/config
cd /src
kubectl config use-context aidbox-nova-beda
kubectl delete secret  beda-software-registry-rgv
# Since pull is async I don't know how to use build token for it
kubectl create secret docker-registry  beda-software-registry-rgv --docker-server=$CI_REGISTRY --docker-username=gitlab+deploy-token-11 --docker-password=rhXGWQsuzD9kKWEssy7c
helm upgrade --set backend.image.hash=$1  --set frontend.image.hash=$1 --namespace=bedasoftware -i rgv .
