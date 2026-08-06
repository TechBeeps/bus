# Placeholder Passenger Webapp Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY passenger-webapp/package.json ./
RUN npm ci
COPY passenger-webapp/ ./
CMD ["npm", "start"]
