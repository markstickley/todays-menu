FROM node:18-slim

RUN apt-get update && apt-get install -y cron procps && rm -rf /var/lib/apt/lists/* && npm up --global

WORKDIR /app

COPY main.js .
COPY entrypoint.sh .
COPY cron.sh .
COPY logrotate.sh .
COPY crontab /etc/cron.d/menucron

RUN chmod +x entrypoint.sh \
    && chmod +x cron.sh \
    && chmod 0644 /etc/cron.d/menucron \
    && crontab /etc/cron.d/menucron

CMD ["./entrypoint.sh"]
