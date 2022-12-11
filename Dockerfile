FROM node:16.13.1
LABEL author="peacake"
ENV PORT=3333
WORKDIR /
COPY . /tbk
RUN apt-get update
RUN apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm1 -y
RUN wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian10-4.4.18.tgz && tar -zxvf mongodb-linux-x86_64-debian10-4.4.18.tgz && rm -rf mongodb-linux-x86_64-debian10-4.4.18.tgz && mv mongodb-linux-x86_64-debian10-4.4.18 /usr/local/mongodb4 && export PATH=/usr/local/mongodb4/bin:$PATH 
RUN mkdir -p /var/lib/mongo && mkdir -p /var/log/mongodb && chown `whoami` /var/lib/mongo && chown `whoami` /var/log/mongodb
RUN cd /usr/local/mongodb4/bin && ./mongod --dbpath /var/lib/mongo --logpath /var/log/mongodb/mongod.log --fork
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org
RUN cd /tbk && cnpm install
RUN cnpm install -g pm2
EXPOSE ${PORT}
CMD cd /tbk && pm2 start tbk-api-server/index.js -n tbk-api-server && pm2 start wechat/index.js -n wechat && pm2 log
