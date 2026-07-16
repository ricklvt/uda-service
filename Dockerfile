ARG BASE_IMAGE=node:24-bookworm-slim

# == BUILD == #
FROM --platform=${BUILDPLATFORM} ${BASE_IMAGE} AS build

RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /usr/src

RUN --mount=type=secret,id=ARTIFACTORY_USERNAME,env=ARTIFACTORY_USERNAME \
    --mount=type=secret,id=ARTIFACTORY_PASSWORD,env=ARTIFACTORY_PASSWORD \
    curl -Ls --user "${ARTIFACTORY_USERNAME}:${ARTIFACTORY_PASSWORD}" \
        https://lvt.jfrog.io/artifactory/api/npm/npm/auth/lvt > .npmrc

# Improve caching between builds
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.npm \
     pnpm i --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm build

# == PRODUCTION DEPS == #
FROM --platform=${BUILDPLATFORM} ${BASE_IMAGE} AS production-deps
WORKDIR /usr/src

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY --from=build /usr/src/package.json /usr/src/pnpm-lock.yaml /usr/src/.npmrc ./
RUN --mount=type=cache,target=/root/node_modules \
  pnpm i --prod --frozen-lockfile --ignore-scripts && pnpm cache delete

# == RUNTIME == #
FROM ${BASE_IMAGE} AS runtime
RUN apt-get update && \
    apt-get install -y sudo procps && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /opt/service

RUN useradd lvt -G sudo -m
RUN chown -R lvt:lvt /opt/service
RUN echo '%sudo ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

COPY --from=production-deps /usr/src/node_modules ./node_modules
COPY --from=build /usr/src/dist ./dist

USER lvt:lvt

CMD [ "node", "--import", "./dist/bootstrap.js", "dist/main.js" ]
