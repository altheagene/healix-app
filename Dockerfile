# FROM node:20-alpine AS development-dependencies-env
# COPY . /app
# WORKDIR /app
# RUN npm ci

# FROM node:20-alpine AS production-dependencies-env
# COPY ./package.json package-lock.json /app/
# WORKDIR /app
# RUN npm ci --omit=dev

# FROM node:20-alpine AS build-env
# COPY . /app/
# COPY --from=development-dependencies-env /app/node_modules /app/node_modules
# WORKDIR /app
# RUN npm run build

# FROM node:20-alpine
# COPY ./package.json package-lock.json /app/
# COPY --from=production-dependencies-env /app/node_modules /app/node_modules
# COPY --from=build-env /app/build /app/build
# WORKDIR /app
# CMD ["npm", "run", "start"]

# Stage 1: Build
FROM node:20 AS build
WORKDIR /app

# Copy package.json and install dependencies ignoring peer deps
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build SSR app
RUN npm run build

# Stage 2: Run
FROM node:20
WORKDIR /app

# Copy build folder and package.json
COPY --from=build /app/build ./build
COPY package*.json ./

# Install dependencies in run stage
RUN npm install --legacy-peer-deps

EXPOSE 3000
CMD ["npm", "start"]

# # Start SSR server
# CMD ["node", "build/server/index.js"]

# Use Python base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements.txt and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your app
COPY . .

# Expose port and run Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
CMD ["flask", "run"]
