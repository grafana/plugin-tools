FROM node:24-alpine

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev && npm install --no-save tsx@4.23.15

COPY src ./src

EXPOSE 8091
# node as PID 1 so docker's SIGTERM reaches the shutdown handler that writes the recording
ENTRYPOINT ["node", "--import", "tsx", "src/bin/run.ts"]
CMD ["serve", "--mode", "replay", "--port", "8091"]
