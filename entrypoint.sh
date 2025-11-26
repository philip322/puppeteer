#!/bin/sh
# entrypoint.sh

# ssh
mkdir -p /root/.ssh && chmod 700 /root/.ssh && \
    touch /root/.ssh/known_hosts
    
# 生成密钥： ssh-keygen -t ed25519 -C "cron-container" -f ./id_cron
# 使用已经生成的密钥，可以持久化保存（已经有公钥的远程服务器可以直接连接）
if [ -f "/data/id_cron" ]; then
    cp -a /data/id_cron* /root/.ssh/
    echo "已复制密钥"
else
    ssh-keygen -t ed25519 -N "" -C "cron-container" -f /root/.ssh/id_cron 
    echo "已生成新的密钥"
    if [ -d "/data" ]; then
        cp -a /root/.ssh/id_cron* /data/
    fi
if
chmod 600 /root/.ssh/id_cron*

cat <<EOF > /root/.ssh/config
Host *
    StrictHostKeyChecking no
    IdentityFile /root/.ssh/id_cron
EOF

# 如果你把任务写在项目里的 crontab 文件，可以这样加载
if [ -f "/data/crontab" ]; then
    cat /data/crontab > /var/spool/cron/crontabs/root
    chmod 600 /var/spool/cron/crontabs/root
    echo "已加载自定义计划任务:"
    cat /var/spool/cron/crontabs/root
fi

# 执行用户定义的脚步
if [ -f "/data/start.sh" ]; then
    bash /data/start.sh
fi


# 执行传入的命令（通常是 crond -f）
exec "$@"
