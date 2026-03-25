#!/bin/sh
cd /data
host=$(curl -s https://sv.req.xx.kg/s)
echo -n $host > /data/hostinfo.txt
echo "已更新账号：$host"
node /data/serv00.js
