# Burst Protection Analysis Dashboard

A Next.js 15 full-stack analytics dashboard that analyzes advertising burst protection effectiveness by querying a Vertica database. The application visualizes campaign performance metrics, budget depletion rates, spending spikes, and blocking activity.

## ✨ Features

- 📊 **Real-time Analytics**: Live dashboard with KPI metrics and trends
- 🎨 **Modern UI/UX**: Gradient cards, smooth animations, enhanced tooltips
- 🔍 **Advanced Filtering**: Date range, advertiser, campaign filters with URL persistence
- 📈 **Interactive Charts**: Multiple chart types with rich tooltips and color-coded data
- 💾 **Smart Caching**: Two-layer caching (server + client) for optimal performance
- 🔄 **Connection Pooling**: Robust Vertica connection pool with automatic retry
- 🌐 **Shareable Links**: Filter state encoded in URL for easy sharing
- 🐳 **Docker Ready**: Full Docker support with multi-stage builds

## 🚀 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js (App Router) | 15.5.5 | Full-stack React framework |
| **UI Library** | React | 19.1.0 | Component-based UI |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Backend** | Next.js API Routes | - | RESTful endpoints |
| **Database** | Vertica | - | Analytical columnar database |
| **State Management** | TanStack Query | 5.90.3 | Server state with caching |
| **UI Components** | Radix UI | - | Accessible primitives |
| **Animations** | Framer Motion | 12.23.24 | Smooth transitions |
| **Charts** | Recharts | 3.2.1 | Data visualizations |
| **Package Manager** | pnpm | - | Fast, efficient package manager |

## 📋 Prerequisites

- **Node.js 20+** (required) - [Download](https://nodejs.org)
- **Vertica database access** (credentials required)
- **pnpm** (installed automatically by setup script)
- **Docker & Docker Compose** (optional, for containerized deployment)

## 🎯 Quick Start (Recommended)

### Automated Setup Script

The easiest way to get started is using the comprehensive setup script:

```bash
# Run the setup script
./setup.sh
```

The script will:
1. ✅ Check Node.js installation (v20+ required)
2. ✅ Install pnpm if not present
3. ✅ Install project dependencies
4. ✅ Configure Vertica credentials interactively
5. ✅ Test database connection
6. ✅ Build the application
7. ✅ Run the application (dev or prod mode)

**Script Options:**

```bash
./setup.sh                  # Full setup
./setup.sh --config-only    # Only configure .env.local
./setup.sh --test-connection # Test existing configuration
./setup.sh --help           # Show all options
```

---

## 🛠️ Manual Setup

### Option 1: Local Development

1. **Install Node.js 20+**:
   ```bash
   # macOS (Homebrew)
   brew install node

   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Or download from https://nodejs.org
   ```

2. **Install pnpm**:
   ```bash
   npm install -g pnpm
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Configure environment variables**:
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
   VERTICA_CONNECTION_TIMEOUT=10000
   ```

5. **Run the development server**:
   ```bash
   pnpm dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

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

---

## 📜 Available Scripts

### Development
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

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VERTICA_HOST` | Yes | `office-vrt.taboolasyndication.com` | Vertica database host |
| `VERTICA_PORT` | Yes | `5433` | Vertica database port |
| `VERTICA_DATABASE` | Yes | `taboola_prod` | Vertica database name |
| `VERTICA_USER` | Yes | - | Vertica username (no default) |
| `VERTICA_PASSWORD` | Yes | - | Vertica password (no default) |
| `VERTICA_CONNECTION_TIMEOUT` | No | `10000` | Connection timeout (ms) |
| `NODE_ENV` | No | `production` | Node environment |
| `NEXT_TELEMETRY_DISABLED` | No | `1` | Disable Next.js telemetry |

## 📁 Project Structure

```
burst-protection-analysis/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # Backend API routes
│   │   │   ├── burst-protection/ # Main data endpoints
│   │   │   ├── test-db/         # Database health check
│   │   │   └── pool-stats/      # Connection pool monitoring
│   │   ├── page.tsx             # Main dashboard page
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   │   ├── dashboard/           # Dashboard-specific
│   │   ├── charts/              # Recharts visualizations
│   │   ├── cards/               # Metric cards
│   │   ├── filters/             # Filter components
│   │   ├── ui/                  # Radix UI primitives
│   │   └── ...
│   ├── lib/                     # Business logic & utilities
│   │   ├── db/                  # Database layer
│   │   │   ├── vertica.ts      # Connection pool (singleton)
│   │   │   ├── queries.ts      # SQL query builders
│   │   │   └── schema.ts       # Zod validation
│   │   ├── analytics/          # Data processing
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions
│   └── types/                   # TypeScript types
├── public/                      # Static assets
├── setup.sh                     # Automated setup script ⭐
├── docker-compose.yml          # Docker Compose config
├── Dockerfile                   # Multi-stage Docker build
└── next.config.ts              # Next.js configuration
```

## 🏗️ Architecture Highlights

### Database Layer
- **Singleton Connection Pool**: HMR-aware pool with automatic retry logic
- **Connection Management**: Min 1, Max 10 connections with validation
- **Query Optimization**: CTEs (Common Table Expressions) for performance
- **Type Safety**: Runtime validation with Zod schemas

### API Layer
- **Next.js API Routes**: RESTful endpoints with Node.js runtime
- **Caching Strategy**: Two-layer caching (node-cache + TanStack Query)
- **Error Handling**: Comprehensive error handling with retry logic
- **Health Monitoring**: `/api/test-db` and `/api/pool-stats` endpoints

### Frontend Layer
- **State Management**: URL-based filter state for shareable links
- **Data Fetching**: TanStack Query with automatic caching
- **UI Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion + CSS transitions
- **Performance**: React.memo, useMemo, useCallback optimizations

### Caching Strategy
1. **Client-Side Cache**: TanStack Query (5 min stale time)
2. **Server-Side Cache**: node-cache (5 min TTL)
3. **Cache Bypass**: Add `?nocache=true` to any API request

📖 See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 🐳 Docker Architecture

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

## ❤️‍🩹 Health Checks

The application includes health checks for monitoring:

- **Database Health**: `/api/test-db`
- **Connection Pool Stats**: `/api/pool-stats`
- **Docker Health Check**: Configured to check every 30s

```bash
# Test database connection
curl http://localhost:3000/api/test-db

# Check connection pool statistics
curl http://localhost:3000/api/pool-stats
```

## 🚀 Production Deployment

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

## 🐛 Troubleshooting

### Common Issues

**Issue: "Cannot connect to Vertica"**
```bash
# Test database connection
./setup.sh --test-connection

# Check credentials in .env.local
cat .env.local

# Check connection pool stats
curl http://localhost:3000/api/pool-stats
```

**Issue: "pnpm: command not found"**
```bash
# Install pnpm globally
npm install -g pnpm
```

**Issue: "Module not found" errors**
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue: "Build fails in Docker"**
```bash
# Ensure BuildKit is enabled
export DOCKER_BUILDKIT=1

# Rebuild with no cache
docker-compose build --no-cache
```

**Issue: "Port 3000 already in use"**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

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

### Debug Mode

Enable verbose logging:
```bash
# Development with debug logs
DEBUG=* pnpm dev

# Check connection pool stats
curl http://localhost:3000/api/pool-stats

# Health check
curl http://localhost:3000/api/test-db
```

## ⚡ Performance Tips

1. **Use caching**: Responses are cached for 5 minutes
2. **Bypass cache**: Add `?nocache=true` when needed
3. **Filter early**: Use advertiser/campaign filters to reduce data
4. **Monitor pool**: Check `/api/pool-stats` for connection health
5. **Production mode**: Run `pnpm build && pnpm start` for optimized performance

## 📚 Documentation

### Project Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [CLAUDE.md](./CLAUDE.md) - Development best practices and patterns
- [electronPlan.md](./electronPlan.md) - Electron desktop app migration plan
- [uiPlan.md](./uiPlan.md) - UI/UX enhancement roadmap
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Recent UI/UX improvements

### Technology Documentation
- [Next.js Documentation](https://nextjs.org/docs) - Next.js 15 features and API
- [TanStack Query](https://tanstack.com/query/latest) - Server state management
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/primitives/docs/overview/introduction) - Accessible component primitives
- [Recharts](https://recharts.org/en-US/) - Composable charting library
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [pnpm Documentation](https://pnpm.io/) - Fast package manager

## 🤝 Contributing

This project follows the coding standards defined in [CLAUDE.md](./CLAUDE.md):
- ✅ Always use pnpm (never npm or yarn)
- ✅ Read nearby .md files before starting tasks
- ✅ Follow existing patterns in the codebase
- ✅ Update documentation when making changes
- ✅ Keep things simple (DRY principle)

## 📄 License

This project is private and proprietary.

## 💬 Support

For issues and questions:
- 📖 Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- 🐛 Review [Troubleshooting](#troubleshooting) section
- 👥 Contact the development team
- 🎫 Open an issue in the repository

---

**Quick Links:**
- 🚀 [Quick Start](#-quick-start-recommended) - Get started in minutes
- 📚 [Architecture](./ARCHITECTURE.md) - Technical deep dive
- 🎨 [UI/UX Plan](./uiPlan.md) - Enhancement roadmap
- 🖥️ [Electron Plan](./electronPlan.md) - Desktop app migration
- 🐛 [Troubleshooting](#-troubleshooting) - Common issues
