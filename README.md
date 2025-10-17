# Burst Protection Analysis Dashboard

A Next.js 15 full-stack analytics dashboard that analyzes advertising burst protection effectiveness by querying a Vertica database. The application visualizes campaign performance metrics, budget depletion rates, spending spikes, and blocking activity.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes (Node.js runtime)
- **Database**: Vertica (custom connection pool)
- **State Management**: TanStack Query
- **UI Components**: Radix UI primitives (shadcn/ui)
- **Package Manager**: pnpm

## Prerequisites

- Node.js 20+ (required)
- Access to Vertica database with credentials
- pnpm (will be installed automatically by setup script)
- Docker & Docker Compose (optional, for containerized deployment)

## Quick Start (Recommended)

### Automated Setup Script

The easiest way to get started is using the automated setup script:

```bash
./setup.sh
```

This script will:
- ✅ Check Node.js installation (requires v20+)
- ✅ Install pnpm (if not present)
- ✅ Install project dependencies
- ✅ Guide you through Vertica credential configuration
- ✅ Test database connection
- ✅ Build the application
- ✅ Start the application (dev or production mode)

**Script Options:**

```bash
./setup.sh                  # Full setup
./setup.sh --config-only    # Only configure .env.local
./setup.sh --test-connection # Test existing configuration
./setup.sh --help           # Show all options
```

---

## Manual Setup

### Option 1: Local Development (without Docker)

1. **Install dependencies**:
```bash
pnpm install
```

2. **Configure environment variables**:
```bash
cp .env.docker.example .env.local
```

Edit `.env.local` with your Vertica credentials:
```env
VERTICA_HOST=office-vrt.taboolasyndication.com
VERTICA_PORT=5433
VERTICA_DATABASE=taboola_prod
VERTICA_USER=your_username
VERTICA_PASSWORD=your_password
```

3. **Run the development server**:
```bash
pnpm dev
```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

### Option 2: Docker (Production-Ready)

#### Quick Start with Docker Compose

1. **Configure environment variables**:
```bash
cp .env.docker.example .env.local
```

Edit `.env.local` with your Vertica credentials.

2. **Build and run**:
```bash
docker-compose up --build
```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

4. **Stop the application**:
```bash
docker-compose down
```

#### Using Docker CLI (without Docker Compose)

1. **Build the Docker image**:
```bash
docker build -t burst-protection-analysis:latest .
```

2. **Run the container**:
```bash
docker run -p 3000:3000 \
  -e VERTICA_HOST=office-vrt.taboolasyndication.com \
  -e VERTICA_PORT=5433 \
  -e VERTICA_DATABASE=taboola_prod \
  -e VERTICA_USER=your_username \
  -e VERTICA_PASSWORD=your_password \
  --name burst-protection-app \
  burst-protection-analysis:latest
```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

4. **Stop the container**:
```bash
docker stop burst-protection-app
docker rm burst-protection-app
```

## Docker Architecture

The Dockerfile uses a multi-stage build strategy for optimal image size and security:

1. **Base Stage**: Sets up Node.js 20 and pnpm
2. **Dependencies Stage**: Installs npm packages with caching
3. **Builder Stage**: Builds the Next.js application with Turbopack
4. **Runner Stage**: Creates minimal production image with standalone output

### Key Features

- Multi-stage build for smaller image size (~200MB)
- Non-root user for security
- Standalone Next.js output (includes only necessary files)
- Health checks for container monitoring
- BuildKit cache optimization
- Resource limits configured in docker-compose.yml

## Available Scripts

### Local Development
```bash
pnpm dev          # Start development server (Turbopack)
pnpm build        # Build for production (Turbopack)
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Docker Commands
```bash
# Build image
docker-compose build

# Start services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build --force-recreate
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VERTICA_HOST` | Yes | `office-vrt.taboolasyndication.com` | Vertica database host |
| `VERTICA_PORT` | Yes | `5433` | Vertica database port |
| `VERTICA_DATABASE` | Yes | `taboola_prod` | Vertica database name |
| `VERTICA_USER` | Yes | - | Vertica username |
| `VERTICA_PASSWORD` | Yes | - | Vertica password |
| `VERTICA_CONNECTION_TIMEOUT` | No | `10000` | Connection timeout (ms) |
| `ENABLE_CUSTOM_CONNECTION` | No | `true` | Enable custom DB connection from UI |
| `NODE_ENV` | No | `production` | Node environment |
| `NEXT_TELEMETRY_DISABLED` | No | `1` | Disable Next.js telemetry |

## Health Checks

The application includes health checks for monitoring:

- **Endpoint**: `/api/test-db`
- **Docker Health Check**: Configured to check every 30s
- **Pool Statistics**: `/api/pool-stats` (connection pool monitoring)

## Production Deployment

### Best Practices

1. **Use Docker secrets** for sensitive data in production
2. **Configure resource limits** in docker-compose.yml based on your needs
3. **Enable logging** to external logging service
4. **Set up monitoring** with health check endpoints
5. **Use a reverse proxy** (nginx/Caddy) for SSL/TLS termination
6. **Enable backup strategy** for persistent data if needed

### Docker Compose Production Example

```yaml
services:
  app:
    image: burst-protection-analysis:latest
    restart: always
    environment:
      - NODE_ENV=production
    secrets:
      - vertica_password
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Troubleshooting

### Docker Issues

**Build fails with "pnpm: command not found"**
- Ensure you're using BuildKit: `export DOCKER_BUILDKIT=1`

**Container exits immediately**
- Check logs: `docker-compose logs app`
- Verify environment variables are set correctly
- Test database connection manually

**Health check failing**
- Verify Vertica database is accessible from container
- Check firewall rules
- Test with: `docker exec burst-protection-app node -e "console.log('OK')"`

**Image size too large**
- Verify standalone output is enabled in `next.config.ts`
- Check `.dockerignore` includes unnecessary files
- Run `docker images` to inspect image size

### Database Connection Issues

**Cannot connect to Vertica**
- Verify credentials in `.env.local`
- Check network connectivity to Vertica host
- Test with: `curl http://localhost:3000/api/test-db`

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Docker Documentation](https://docs.docker.com/) - Docker containerization
- [pnpm Documentation](https://pnpm.io/) - Fast, disk space efficient package manager
- [TanStack Query](https://tanstack.com/query/latest) - Data synchronization

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team or open an issue in the repository.
