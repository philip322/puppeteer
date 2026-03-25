#!/usr/bin/sh
cd /data
rm -rf *.png
echo "Hello World ~~"
cat <<EOF
SV_HOST=""
TELEGRAM=''
SV_PASSWORD=''
ID_CRON=''
ID_CRON_PUB=''
SWITCH_SHELL=''
SSH_USER=''
SSH_PASSWORD=''
EOF

cat $TELEGRAM >telegram.json
cat $SV_PASSWORD>password.txt
curl -s ident.me >ip.txt
cat $ID_CRON>id_ron
cat $ID_CRON_PUB>id_cron.pub
curl -s -o switch_node.sh $SWITCH_SHELL
