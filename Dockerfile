# build step
FROM node:lts-alpine as build-stage

# Create app directory
WORKDIR /app

# Chromium for Puppeteer pre-rendering at build time
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

# args
ARG NODE_ENV='development'
ARG DEVKIT_VUE_app_title='Devkit-Docker'
ARG DEVKIT_VUE_api_protocol='http'
ARG DEVKIT_VUE_api_host='localhost'
ARG DEVKIT_VUE_api_port='3000'
ARG DEVKIT_VUE_api_base='api'
ARG DEVKIT_VUE_cookie_prefix='waos'
# Analytics ARGs: declared without defaults so BuildKit does NOT leak empty
# strings into process.env at build time. With defaults, BuildKit exposes
# the ARG as an env var to RUN steps, and generateConfig.js Layer 5
# (DEVKIT_VUE_* env-var override) silently overrides downstream
# config-file values with the empty/false defaults. Issue: pierreb-devkit/Vue#4110
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

# Install app dependencies & build
COPY package*.json ./
RUN npm install
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