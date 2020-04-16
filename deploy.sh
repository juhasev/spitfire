#!/bin/bash

# Copying game file over
echo "Building app"
npm run build
echo "Deploying application"
cd dist
scp -r * root@167.99.109.57:/usr/share/nginx/html
cd ..

echo "Setting file permissions"
ssh root@167.99.109.57 chown -R root:root /usr/share/nginx/html
ssh root@167.99.109.57 chmod -R 755 /usr/share/nginx/html

echo "SUCCESS!"

