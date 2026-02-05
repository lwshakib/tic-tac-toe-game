# Use the official Bun image as the base image for building and running the web app
FROM oven/bun:latest

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the package.json and bun.lock files to the working directory in the container
COPY package.json bun.lock ./

# Execute bun install to pull and install all necessary npm packages
RUN bun install

# Copy the entire web application source code into the container
COPY . .

# Run the build script to generate a production-ready Next.js deployment
RUN bun run build

# Notify Docker that the application in the container listens on port 3000
EXPOSE 3000

# Specify the command to run the production server once the container launches
CMD ["bun", "run", "start"]
