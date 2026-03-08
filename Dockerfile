# build step
FROM node:lts-alpine as build-stage

# Create app directory
WORKDIR /app

# args
ARG NODE_ENV='development'
ARG DEVKIT_VUE_app_title='Devkit-Docker'
ARG DEVKIT_VUE_api_protocol='http'
ARG DEVKIT_VUE_api_host='localhost'
ARG DEVKIT_VUE_api_port='3000'
ARG DEVKIT_VUE_api_base='api'
ARG DEVKIT_VUE_cookie_prefix='waos'

# Install app dependencies & build
COPY package*.json ./
RUN npm install
COPY . .
RUN echo "NODE_ENV=$NODE_ENV" && npm run build

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