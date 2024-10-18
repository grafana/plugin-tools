#!/bin/bash

docker buildx build \
  --platform linux/arm64 \
  --build-arg ARCH=arm64 \
  -f Dockerfile \
  -t grafana/grafana-plugindev-linux-arm64:v1 .

docker buildx build \
  --platform linux/amd64 \
  --build-arg ARCH=amd64 \
  -f Dockerfile \
  -t grafana/grafana-plugindev-linux-amd64:v1 .

