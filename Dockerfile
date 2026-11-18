# build step
FROM node:26-alpine as build-stage

# Create app directory
WORKDIR /app

# Chromium for Puppeteer pre-rendering at build time
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

# args
ARG NODE_ENV='development'
# DEVKIT_VUE_* ARGs are declared WITHOUT defaults. A default is exposed as an
# env var to RUN steps, and generateConfig.js Layer 5 (DEVKIT_VUE_* env-var
# override) would then silently override the project's config-file values.
# Pass a value with --build-arg only when you want it to win over config.
# Issues: pierreb-devkit/Vue#4110, #4876
ARG DEVKIT_VUE_app_title
ARG DEVKIT_VUE_app_version
ARG DEVKIT_VUE_app_seo_docs_contentUrl
ARG DEVKIT_VUE_api_protocol
ARG DEVKIT_VUE_api_host
ARG DEVKIT_VUE_api_port
ARG DEVKIT_VUE_api_base
ARG DEVKIT_VUE_cookie_prefix
ARG DEVKIT_VUE_analytics_sentry_dsn
ARG DEVKIT_VUE_analytics_sentry_environment
ARG DEVKIT_VUE_analytics_posthog_key
ARG DEVKIT_VUE_analytics_posthog_host
ARG DEVKIT_VUE_analytics_posthog_errorTracking
ARG DEVKIT_VUE_analytics_posthog_autoCapture
ARG DEVKIT_VUE_analytics_posthog_sessionReplay
ARG DEVKIT_VUE_analytics_posthog_featureFlags
ARG DEVKIT_VUE_analytics_posthog_surveys
ARG DEVKIT_VUE_analytics_posthog_webVitals
ARG DEVKIT_VUE_analytics_posthog_capturePageleave
ARG DEVKIT_VUE_analytics_posthog_cookielessMode

# Install app dependencies & build
# `npm ci` installs exactly from package-lock.json (reproducible builds);
# package*.json above copies the lockfile in, which `npm ci` requires.
COPY package*.json ./
RUN npm ci
COPY . .
RUN NODE_ENV=$NODE_ENV npm run build

# prod step
FROM nginx:stable-alpine as production-stage

# Copy all build
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Add nginx config
COPY nginx.example.conf /temp/prod.conf
RUN envsubst /app < /temp/prod.conf > /etc/nginx/conf.d/default.conf

# Expose
EXPOSE 80

# Command to run
CMD ["nginx", "-g", "daemon off;"]