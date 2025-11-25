#!/bin/sh
# entrypoint.sh

mkdir -p /root/.ssh && chmod 700 /root/.ssh && \
    touch /root/.ssh/known_hosts
cp id_cron* /root/.ssh/
chmod 600 /root/.ssh/id_cron* && \
    echo "Host *" >> /root/.ssh/config && \
    echo "  StrictHostKeyChecking no" >> /root/.ssh/config && \
    echo "  IdentityFile /root/.ssh/id_cron" >> /root/.ssh/config
    
echo "alias ll='ls -la'" > /root/.bashrc  
echo "PS1='[\W]\$ '" >> /root/.bashrc

# 如果你把任务写在项目里的 crontab 文件，可以这样加载
if [ -f "/app/crontab" ]; then
    cat /app/crontab > /var/spool/cron/crontabs/root
    chmod 600 /var/spool/cron/crontabs/root
    echo "Loaded custom crontab:"
    cat /var/spool/cron/crontabs/root
fi

# 如果没有就创建一个示例任务，防止空
if [ ! -f "/var/spool/cron/crontabs/root" ]; then
    echo "0 0 1 1 1 echo 'Cron is running' >> /var/log/cron.log" > /var/spool/cron/crontabs/root
fi

# 确保日志可写
touch /var/log/cron.log

# 执行用户定义的脚步
if [ -f "/data/start.sh" ]; then
    rm -rf /data/node_modules && ln -s /root/node_modules /data/node_modules
    bash /data/start.sh
fi


# 执行传入的命令（通常是 crond -f）
exec "$@"
