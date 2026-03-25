#!/bin/sh
cd /data
host=$(curl -s "https://sv.req.xx.kg/$1")
echo -n $host > /data/hostinfo.txt
echo "已更新账号：$host"
node /data/serv00.js
