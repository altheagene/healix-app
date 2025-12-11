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

# 
# Stage 1: Build React frontend
FROM node:20 AS frontend
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Flask backend
FROM python:3.12-slim
WORKDIR /app

# 1️⃣ Copy requirements.txt first
COPY requirements.txt .

# 2️⃣ Install Python dependencies (Flask included)
RUN pip install --no-cache-dir -r requirements.txt

# 3️⃣ Copy backend code
COPY . .

# 4️⃣ Copy frontend build
COPY --from=frontend /app/build ./frontend/build

# 5️⃣ Expose port and set Flask environment
EXPOSE 5000
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# 6️⃣ Start Flask
CMD ["flask", "run"]
