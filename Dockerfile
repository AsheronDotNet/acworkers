FROM asherondotnet/ubuntu-packetsender:latest
RUN apt-get install -y nodejs
WORKDIR /var/script/
COPY package.json /var/script/
RUN npm install --only=production
COPY . /var/script/
CMD [ "npm", "start" ]
