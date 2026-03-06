#!/bin/bash

openssl aes-256-cbc -K $encrypted_06a00f58bbdd_key -iv $encrypted_06a00f58bbdd_iv -in deploy_rsa_vue.enc -out deploy_key_vue -d

eval "$(ssh-agent -s)" # Start ssh-agent cache
chmod 600 $TRAVIS_BUILD_DIR/deploy_key_vue # Allow read access to the private key
ssh-add $TRAVIS_BUILD_DIR/deploy_key_vue # Add the private key to SSH

ssh -p $sshPort $sshUser@$sshHost -o StrictHostKeyChecking=no "$( cat <<EOT
  source .zshrc
  cd '${depPath}'
  nvm install '${depNode}'
  nvm use '${depNode}'
  git stash
  git pull
  npm i
  NODE_ENV=production DEVKIT_VUE_api_protocol='${depApiProtocol}' DEVKIT_VUE_api_host='${depApiHost}' DEVKIT_VUE_api_port='${depApiPort}' npm run build
  echo "$(date -u) Deploy ${depProject} on node $(node -v) with npm $(npm -v)"  >> ./deploy.log
  exit
EOT
)"
