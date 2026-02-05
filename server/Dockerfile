# Use the official Bun image as the base image for the container
FROM oven/bun:latest

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the package.json and bun.lock files into the container's working directory
COPY package.json bun.lock ./

# Run the bun install command to set up the necessary project dependencies
RUN bun install

# Copy all the files from the current local directory into the container's /app directory
COPY . .

# Inform Docker that the container will listen on network port 3001 at runtime
EXPOSE 3001

# Define the command to execute when the container starts to run the server
CMD ["bun", "run", "src/index.ts"]
