# Deployment Guide - Fly.io

This guide explains how to deploy the Truck Route Planner to Fly.io with MongoDB Atlas.

## Prerequisites

1. **MongoDB Atlas Account**
   - Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a database user with read/write permissions
   - Whitelist all IPs (0.0.0.0/0) in Network Access (or add Fly.io IPs)
   - Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/`)

2. **Fly.io Account**
   - Sign up at [fly.io](https://fly.io)
   - Install flyctl CLI: `curl -L https://fly.io/install.sh | sh` (Linux/Mac) or download from [fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/)
   - Login: `flyctl auth login`

## Initial Setup

### 1. Launch the App

From the project root:

```bash
fly launch
```

This will:
- Detect the Dockerfile
- Create `fly.toml` if it doesn't exist
- Prompt you for app name and region
- **Do NOT deploy yet** - we need to set secrets first

If prompted to deploy, answer **No**.

### 2. Set MongoDB Connection String

```bash
fly secrets set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/truckPlanner?retryWrites=true&w=majority"
```

Replace with your actual MongoDB Atlas connection string.

### 3. Deploy

```bash
fly deploy
```

This will:
- Build the Docker image
- Push to Fly.io registry
- Deploy to your app
- Start the server

### 4. Verify Deployment

```bash
fly open
```

Opens your deployed app in the browser.

Check logs:
```bash
fly logs
```

## Environment Variables

The app uses these environment variables:

- `MONGODB_URI` (required): MongoDB Atlas connection string
- `PORT` (optional): Server port (Fly.io sets this automatically to 3000)

**Important**: Never commit `.env` with secrets to git. Use `fly secrets set` for production.

## Scaling

### View current status
```bash
fly status
```

### Scale machines
```bash
fly scale count 1  # Run 1 machine
fly scale count 2  # Run 2 machines for redundancy
```

### Change machine size
```bash
fly scale vm shared-cpu-1x --memory 512
```

## Troubleshooting

### Check if app is running
```bash
fly status
```

### View real-time logs
```bash
fly logs
```

### SSH into the machine
```bash
fly ssh console
```

### Restart the app
```bash
fly apps restart
```

### Check secrets
```bash
fly secrets list
```

## Local Development vs Production

### Local Development

1. Create `.env` file (copy from `.env.example`):
   ```
   MONGODB_URI=mongodb+srv://...
   PORT=3000
   ```

2. Run frontend dev server (with proxy):
   ```bash
   npm run dev
   ```

3. In another terminal, run backend:
   ```bash
   npm run dev:server
   ```

### Production Build (Test Locally)

1. Build frontend:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000

## Notes

- **Vite env vars**: Vite env vars (VITE_*) are build-time only. The MongoDB URI must stay server-side.
- **Auto-sleep**: Free tier machines auto-sleep after inactivity and wake on request.
- **Database migrations**: MongoDB is schemaless; no migrations needed. Documents are stored with full booking payload.
- **Backups**: Enable continuous backup in MongoDB Atlas (paid feature) or export data periodically.

## Useful Commands

```bash
# View app info
fly info

# View secrets
fly secrets list

# Set a new secret
fly secrets set KEY=value

# Unset a secret
fly secrets unset KEY

# View deployments
fly releases

# Rollback to previous version
fly releases rollback <version>

# Delete app (DESTRUCTIVE)
fly apps destroy <app-name>
```

## Further Reading

- [Fly.io Documentation](https://fly.io/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
