# Use an official Node.js alpine runtime as the base image
FROM node:alpine

# Set the working directory in the Docker image
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application's dependencies inside the Docker image
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application to the working directory
COPY . .

# Run Prisma migrations
RUN npx prisma migrate deploy

# Expose port 3000 for the application
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "server.js" ]