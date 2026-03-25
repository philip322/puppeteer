#!/bin/sh
cd /data
host=$(curl -s "https://${SV_HOST}/$1")
echo -n $host > /data/hostinfo.txt
echo "已更新账号：$host"
node /data/weblogin.js
