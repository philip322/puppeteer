#!/usr/bin/sh
cd /data
rm -rf *.png
echo "Hello World ~~"
cat $TELEGRAM >telegram.json
cat $SV_PASSWORD=>password.txt
curl -s ident.me >ip.txt
