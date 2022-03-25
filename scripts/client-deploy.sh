#!/bin/sh
GCP_ARTIFACT_REGISTRY_REPOSITORY="us-central1-docker.pkg.dev/rtterror/client/app";
DEFAULT_TAG="latest";

while getopts ":t:" option; do
   case $option in
      t)
         TAG=$OPTARG;;
     \?)
         exit;;
   esac
done
clear;
if [ -z "$TAG" ]
then
  TAG=$DEFAULT_TAG;
fi

DOCKER_IMAGE_URI="$GCP_ARTIFACT_REGISTRY_REPOSITORY:$TAG";

docker build -t "$DOCKER_IMAGE_URI" ./frontend
docker push "$DOCKER_IMAGE_URI"

gcloud run deploy app \
--image=$DOCKER_IMAGE_URI \
--concurrency=80 \
--cpu=1 \
--memory=1024Mi \
--min-instances=0 \
--timeout=300s

gcloud run services update-traffic app --to-latest
