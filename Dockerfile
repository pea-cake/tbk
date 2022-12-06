FROM node:16.13.1
LABEL author="peacake"
ENV PORT=3333
WORKDIR /
COPY . /tbk
RUN wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian10-4.4.18.tgz && tar -zxvf mongodb-linux-x86_64-debian10-4.4.18.tgz && rm -rf mongodb-linux-x86_64-debian10-4.4.18.tgz && mv mongodb-linux-x86_64-debian10-4.4.18 /usr/local/mongodb4 && export PATH=/usr/local/mongodb4/bin:$PATH 
RUN mkdir -p /var/lib/mongo && mkdir -p /var/log/mongodb && chown `whoami` /var/lib/mongo && chown `whoami` /var/log/mongodb
RUN cd /usr/local/mongodb4/bin && ./mongod --dbpath /var/lib/mongo --logpath /var/log/mongodb/mongod.log --fork
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org
RUN cd /tbk && cnpm install
RUN cnpm install -g pm2
EXPOSE ${PORT}
CMD cd /tbk && pm2 start tbk-api-server/index.js -n tbk-api-server && pm2 start wechat/index.js -n wechat && pm2 log
