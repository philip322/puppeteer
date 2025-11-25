# 第一阶段构建基础puppeteer
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ tzdata
RUN npm config set registry https://registry.npmmirror.com/  && \
    npm cache clean --force
WORKDIR /app
RUN npm install puppeteer@latest --production --legacy-peer-deps

# 第二阶段打包镜像安装所需软件
FROM node:20-alpine
RUN apk add --no-cache \
    chromium  nss freetype harfbuzz ca-certificates ttf-freefont font-noto-cjk \
    openssh-client sshpass curl bash
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY --from=builder /app/node_modules /root/node_modules
COPY --from=builder /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN echo "Asia/Shanghai" > /etc/timezone

# SSH基础设置
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh && \
    touch /root/.ssh/known_hosts
COPY id_cron* /root/.ssh/
RUN chmod 600 /root/.ssh/id_cron* && \
    echo "Host *" >> /root/.ssh/config && \
    echo "  StrictHostKeyChecking no" >> /root/.ssh/config && \
    echo "  IdentityFile /root/.ssh/id_cron" >> /root/.ssh/config
    
RUN echo "alias ll='ls -la'" > /root/.bashrc && \
    echo "PS1='\[\e[1;32m\][\W]\$\[\e[0m\] '" >> /root/.bashrc
    
WORKDIR /root
COPY package.json ./
COPY index.js ./

COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

# 最终命令：启动 cron 并给 shell
ENTRYPOINT ["/entrypoint.sh"]
CMD ["crond", "-f", "-l", "4"]
