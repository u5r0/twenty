# Quick Start Guide

Get Twenty up and running in

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v24.5.0 or higher
- **Yarn** v4.0.2 or higher
- **Docker** (for database services)
- **Git** (for cloning the repository)

## Installation Methods

### Option 1: Docker Compose (Recommended for Production)

The fastest way to run Twenty in production:

```bash
# Clone the repository
git clone https://github.com/twentyhq/twenty.git
cd twenty

# Navigate to docker directory
cd packages/twenty-docker

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start services
docker-compose up -d
```

Access Twenty at `http://localhost:3000`

### Option 2: Local Development Setup

For development and contributing:

```bash
# Clone the repository
git clone https://github.com/twentyhq/twenty.git
cd twenty

# Install dependencies
yarn install

# Copy environment files
cp packages/twenty-server/.env.example packages/twenty-server/.env
cp packages/twenty-front/.env.example packages/twenty-front/.env

# Start PostgreSQL and Redis with Docker
docker-compose -f packages/twenty-docker/docker-compose.yml up -d postgres redis

# Run database migrations
cd packages/twenty-server
yarn database:migrate

# Start the application (from root)
cd ../..
yarn start
```

This starts:
- Frontend at `http://localhost:3000`
- Backend at `http://localhost:3001`
- GraphQL Playground at `http://localhost:3001/graphql`

### Option 3: Cloud Deployment

Deploy to cloud platforms:

**Render:**
```bash
# Use the render.yaml configuration
# Connect your GitHub repo to Render
# Deploy with one click
```

**Railway:**
```bash
# Use Railway's GitHub integration
# Configure environment variables
# Deploy automatically
```

**AWS/GCP/Azure:**
See [Deployment Guide](./18-deployment.md) for detailed instructions.

## First-Time Setup

### 1. Create Your Account

1. Navigate to `http://localhost:3000`
2. Click "Sign Up"
3. Enter your email and password
4. Verify your email (if configured)

### 2. Create Your Workspace

1. After login, you'll be prompted to create a workspace
2. Enter workspace name (e.g., "My Company")
3. Choose your workspace URL slug
4. Click "Create Workspace"

### 3. Set Up Your First Object

Twenty comes with default objects (Companies, People, Opportunities). To create a custom object:

1. Go to Settings → Data Model
2. Click "Add Object"
3. Enter object details:
   - Name: "Projects"
   - Icon: Choose an icon
   - Description: "Track client projects"
4. Add fields:
   - Name (Text)
   - Status (Select)
   - Start Date (Date)
   - Budget (Currency)
5. Click "Save"

### 4. Import Data (Optional)

Import existing data:

1. Navigate to your object (e.g., Companies)
2. Click "Import" button
3. Upload CSV file
4. Map columns to fields
5. Click "Import"

### 5. Invite Team Members

1. Go to Settings → Members
2. Click "Invite Member"
3. Enter email address
4. Select role (Admin, Member, Viewer)
5. Click "Send Invitation"

## Basic Usage

### Creating Records

**Via UI:**
1. Navigate to an object (e.g., Companies)
2. Click "+ New" button
3. Fill in the form
4. Click "Save"

**Via API:**
```graphql
mutation CreateCompany {
  createCompany(
    data: {
      name: "Acme Corp"
      domainName: "acme.com"
      employees: 100
    }
  ) {
    id
    name
    domainName
  }
}
```

### Viewing Records

**Table View:**
- Click on any object in the sidebar
- Use filters, sorting, and grouping
- Customize visible columns

**Kanban View:**
- Switch to Kanban view
- Drag and drop cards between columns
- Group by any select/status field

### Filtering Data

1. Click "Filter" button
2. Add filter conditions:
   - Field: "Status"
   - Operator: "is"
   - Value: "Active"
3. Add multiple filters with AND/OR logic
4. Save filter as a view

### Creating Views

1. Apply filters, sorting, and grouping
2. Click "Save View"
3. Name your view (e.g., "Active Deals")
4. Choose visibility (Personal or Shared)
5. Click "Save"

## Common Tasks

### Customize Fields

1. Go to Settings → Data Model
2. Select an object
3. Click "Add Field"
4. Choose field type:
   - Text, Number, Date, Select, etc.
5. Configure field options
6. Click "Save"

### Set Up Automation

1. Go to Settings → Workflows
2. Click "Create Workflow"
3. Choose trigger:
   - Record Created
   - Record Updated
   - Field Changed
4. Add conditions (optional)
5. Add actions:
   - Send Email
   - Create Record
   - Update Record
   - Call Webhook
6. Test and activate

### Configure Permissions

1. Go to Settings → Roles
2. Create or edit a role
3. Set object permissions:
   - Read, Create, Update, Delete
4. Set field permissions:
   - View, Edit
5. Assign role to users

### Connect Email

1. Go to Settings → Integrations
2. Click "Connect Email"
3. Choose provider (Gmail, Outlook)
4. Authorize access
5. Select sync options
6. Click "Connect"

## Development Workflow

### Running Tests

```bash
# Run all tests
yarn test

# Run frontend tests
cd packages/twenty-front
yarn test

# Run backend tests
cd packages/twenty-server
yarn test

# Run e2e tests
cd packages/twenty-e2e-testing
yarn test:e2e
```

### Building for Production

```bash
# Build all packages
yarn build

# Build specific package
cd packages/twenty-front
yarn build
```

### Code Quality

```bash
# Lint code
yarn lint

# Format code
yarn fmt

# Type check
yarn typecheck
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check connection
psql -h localhost -U twenty -d twenty
```

### Frontend Not Loading

```bash
# Clear cache
rm -rf packages/twenty-front/node_modules/.vite

# Reinstall dependencies
yarn install

# Restart dev server
yarn start
```

### GraphQL Schema Issues

```bash
# Regenerate GraphQL types
cd packages/twenty-front
yarn graphql:generate

# Restart server
cd ../twenty-server
yarn start:dev
```

## Next Steps

Now that you have Twenty running:

1. **Explore Features**
   - Try different views (Table, Kanban)
   - Create custom objects and fields
   - Set up workflows

2. **Learn the Architecture**
   - [System Architecture](./04-system-architecture.md)
   - [Frontend Architecture](./07-frontend-architecture.md)
   - [Backend Architecture](./11-backend-architecture.md)

3. **Start Developing**
   - [Development Setup](./03-development-setup.md)
   - [Component Guidelines](./08-component-guidelines.md)
   - [Contributing Guide](./21-contributing.md)

4. **Deploy to Production**
   - [Deployment Guide](./18-deployment.md)
   - [Configuration](./19-configuration.md)
   - [Monitoring](./20-monitoring.md)

## Getting Help

- **Documentation:** https://docs.twenty.com
- **Discord:** https://discord.gg/cx5n4Jzs57
- **GitHub Issues:** https://github.com/twentyhq/twenty/issues
- **Troubleshooting:** [Troubleshooting Guide](./26-troubleshooting.md)

---

**Related Documentation:**
- [Development Setup](./03-development-setup.md)
- [Configuration](./19-configuration.md)
- [Troubleshooting](./26-troubleshooting.md)

