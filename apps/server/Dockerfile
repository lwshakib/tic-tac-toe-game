# Use the official Node image as the base image
FROM node:20-alpine

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the entire monorepo into the container
# This is necessary because the server might depend on workspace packages in the future
COPY . .

# Install dependencies for the whole monorepo
RUN pnpm install

# Build the server app
RUN pnpm --filter server build

# Notify Docker that the application in the container listens on port 4000
EXPOSE 4000

# Specify the command to run the server
CMD ["pnpm", "--filter", "server", "start"]
