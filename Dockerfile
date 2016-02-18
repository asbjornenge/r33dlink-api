FROM node:5.5.0-wheezy
RUN apt-get update
RUN apt-get install -y poppler-utils
RUN npm install -g babel-cli
ADD build.js /app/index.js
ADD package.json /app
WORKDIR /app
RUN npm install
CMD ["node","index.js"]
