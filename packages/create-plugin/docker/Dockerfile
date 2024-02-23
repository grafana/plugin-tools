ARG ARCH=amd64
ARG BASE_IMAGE=grafana/grafana-oss-${ARCH}:development-ubuntu

FROM ${BASE_IMAGE} as plugindev

ARG GO_VERSION=1.21.6
ARG GO_ARCH=amd64


LABEL maintainer="Grafana Labs <hello@grafana.com>"

ENV GF_PATHS_HOME="/usr/share/grafana"
WORKDIR $GF_PATHS_HOME

USER root
RUN apt-get update && \
    apt-get install -y supervisor && \
    rm -rf /var/lib/apt/lists/*

COPY supervisord/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Installing Go
RUN curl -O -L https://golang.org/dl/go${GO_VERSION}.linux-${GO_ARCH}.tar.gz && \
    rm -rf /usr/local/go && \
    tar -C /usr/local -xzf go${GO_VERSION}.linux-${GO_ARCH}.tar.gz && \
    echo "export PATH=$PATH:/usr/local/go/bin:~/go/bin" >> ~/.bashrc && \
    rm -f go${GO_VERSION}.linux-${GO_ARCH}.tar.gz

# Installing delve for debugging
RUN /usr/local/go/bin/go install github.com/go-delve/delve/cmd/dlv@latest

# Installing mage for plugin (re)building
RUN git clone https://github.com/magefile/mage; \
    cd mage; \
    export PATH=$PATH:/usr/local/go/bin; \
    go run bootstrap.go

ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
