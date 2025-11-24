FROM node:20-alpine

# 1. 基础依赖 + Chromium + Puppeteer 相关
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk \
    make \
    g++

# npm 配置（加速 + 清理）
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm cache clean --force

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    
# 2. 添加 SSH 客户端
RUN apk add --no-cache openssh-client sshpass
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh && \
    touch /root/.ssh/known_hosts
# 复制私钥（确保权限是 600！）
COPY id_cron /root/.ssh/id_cron
RUN chmod 600 /root/.ssh/id_cron && \
    echo "Host *" >> /root/.ssh/config && \
    echo "  StrictHostKeyChecking no" >> /root/.ssh/config && \
    echo "  IdentityFile /root/.ssh/id_cron" >> /root/.ssh/config
    
WORKDIR /app
COPY package.json ./
RUN npm install --production --verbose --legacy-peer-deps
RUN apk del make g++
COPY index.js ./
COPY crontab ./

# 创建 crontab（保留你之前的定时任务）
RUN mkdir -p /var/spool/cron/crontabs && \
    echo "# */2 * * * * /usr/bin/node /app/0.js >> /var/log/cron.log 2>&1" > /var/spool/cron/crontabs/root && \
    chmod 600 /var/spool/cron/crontabs/root && \
    touch /var/log/cron.log
    
COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh
# 最终命令：启动 cron 并给 shell
ENTRYPOINT ["/entrypoint.sh"]
CMD ["crond", "-f", "-l", "4"]
