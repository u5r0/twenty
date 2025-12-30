# Deploymede

Complete guide for deploying Twenty to production environments.

## Deployment Options

### 1. Docker Compose (Simplest)
- Best for: Small teams, single server
- Complexity: Low
- Scalability: Limited

### 2. Kubernetes (Recommended)
- Best for: Production, high availability
- Complexity: Medium
- Scalability: Excellent

### 3. Cloud Platforms (Managed)
- Best for: Quick deployment, managed services
- Complexity: Low to Medium
- Scalability: Good

## Prerequisites

- Domain name with DNS access
- SSL certificate (Let's Encrypt recommended)
- Server or cloud account
- Database backup strategy
- Monitoring setup

## Docker Compose Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
# Clone Twenty
git clone https://github.com/twentyhq/twenty.git
cd twenty/packages/twenty-docker
```

### 3. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Production .env:**
```env
# Domain
DOMAIN=your-domain.com
PROTOCOL=https

# Database
PG_DATABASE_URL=postgres://twenty:STRONG_PASSWORD@postgres:5432/twenty
POSTGRES_PASSWORD=STRONG_PASSWORD

# Redis
REDIS_URL=redis://redis:6379

# JWT Secrets (generate with: openssl rand -base64 32)
ACCESS_TOKEN_SECRET=your-access-token-secret
LOGIN_TOKEN_SECRET=your-login-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
FILE_TOKEN_SECRET=your-file-token-secret

# Email (SMTP)
EMAIL_FROM_ADDRESS=noreply@your-domain.com
EMAIL_SYSTEM_ADDRESS=system@your-domain.com
EMAIL_SMTP_HOST=smtp.your-provider.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-smtp-user
EMAIL_SMTP_PASSWORD=your-smtp-password

# Storage
STORAGE_TYPE=s3
STORAGE_S3_REGION=us-east-1
STORAGE_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional: Sentry
SENTRY_DSN=your-sentry-dsn
```

### 4. Update docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: twenty
      POSTGRES_USER: twenty
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U twenty"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    image: twentycrm/twenty:latest
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      PG_DATABASE_URL: ${PG_DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      ACCESS_TOKEN_SECRET: ${ACCESS_TOKEN_SECRET}
      LOGIN_TOKEN_SECRET: ${LOGIN_TOKEN_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      FILE_TOKEN_SECRET: ${FILE_TOKEN_SECRET}
      FRONT_BASE_URL: ${PROTOCOL}://${DOMAIN}
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    image: twentycrm/twenty:latest
    restart: always
    depends_on:
      - server
    environment:
      PG_DATABASE_URL: ${PG_DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
    command: yarn worker:prod

  front:
    image: twentycrm/twenty-front:latest
    restart: always
    depends_on:
      - server
    environment:
      REACT_APP_SERVER_BASE_URL: ${PROTOCOL}://${DOMAIN}
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    restart: always
    depends_on:
      - front
      - server
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres-data:
  redis-data:
```

### 5. Configure Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server front:3000;
    }

    upstream backend {
        server server:3001;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # GraphQL
        location /graphql {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

### 7. Start Services

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 8. Run Migrations

```bash
# Run database migrations
docker-compose exec server yarn database:migrate

# Seed database (optional)
docker-compose exec server yarn database:seed
```

## Kubernetes Deployment

### 1. Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installation
kubectl version --client
```

### 2. Create Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: twenty
```

```bash
kubectl apply -f namespace.yaml
```

### 3. Create Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: twenty-secrets
  namespace: twenty
type: Opaque
stringData:
  postgres-password: YOUR_POSTGRES_PASSWORD
  access-token-secret: YOUR_ACCESS_TOKEN_SECRET
  refresh-token-secret: YOUR_REFRESH_TOKEN_SECRET
  login-token-secret: YOUR_LOGIN_TOKEN_SECRET
  file-token-secret: YOUR_FILE_TOKEN_SECRET
```

```bash
kubectl apply -f secrets.yaml
```

### 4. PostgreSQL Deployment

```yaml
# postgres.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: twenty
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: twenty
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: twenty
        - name: POSTGRES_USER
          value: twenty
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: twenty-secrets
              key: postgres-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: twenty
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

```bash
kubectl apply -f postgres.yaml
```

### 5. Redis Deployment

```yaml
# redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: twenty
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: twenty
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

```bash
kubectl apply -f redis.yaml
```

### 6. Twenty Server Deployment

```yaml
# server.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: twenty-server
  namespace: twenty
spec:
  replicas: 3
  selector:
    matchLabels:
      app: twenty-server
  template:
    metadata:
      labels:
        app: twenty-server
    spec:
      containers:
      - name: server
        image: twentycrm/twenty:latest
        env:
        - name: PG_DATABASE_URL
          value: postgres://twenty:$(POSTGRES_PASSWORD)@postgres:5432/twenty
        - name: REDIS_URL
          value: redis://redis:6379
        - name: ACCESS_TOKEN_SECRET
          valueFrom:
            secretKeyRef:
              name: twenty-secrets
              key: access-token-secret
        - name: REFRESH_TOKEN_SECRET
          valueFrom:
            secretKeyRef:
              name: twenty-secrets
              key: refresh-token-secret
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: twenty-secrets
              key: postgres-password
        ports:
        - containerPort: 3001
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: twenty-server
  namespace: twenty
spec:
  selector:
    app: twenty-server
  ports:
  - port: 3001
    targetPort: 3001
```

```bash
kubectl apply -f server.yaml
```

### 7. Twenty Frontend Deployment

```yaml
# frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: twenty-front
  namespace: twenty
spec:
  replicas: 2
  selector:
    matchLabels:
      app: twenty-front
  template:
    metadata:
      labels:
        app: twenty-front
    spec:
      containers:
      - name: front
        image: twentycrm/twenty-front:latest
        env:
        - name: REACT_APP_SERVER_BASE_URL
          value: https://your-domain.com
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: twenty-front
  namespace: twenty
spec:
  selector:
    app: twenty-front
  ports:
  - port: 3000
    targetPort: 3000
```

```bash
kubectl apply -f frontend.yaml
```

### 8. Ingress Configuration

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: twenty-ingress
  namespace: twenty
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - your-domain.com
    secretName: twenty-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: twenty-server
            port:
              number: 3001
      - path: /graphql
        pathType: Prefix
        backend:
          service:
            name: twenty-server
            port:
              number: 3001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: twenty-front
            port:
              number: 3000
```

```bash
kubectl apply -f ingress.yaml
```

## Cloud Platform Deployments

### Render

1. **Connect Repository**
   - Go to Render dashboard
   - Click "New +" → "Blueprint"
   - Connect GitHub repository

2. **Configure render.yaml**
   ```yaml
   services:
     - type: web
       name: twenty-server
       env: node
       buildCommand: yarn install && yarn build
       startCommand: yarn start:prod
       envVars:
         - key: PG_DATABASE_URL
           fromDatabase:
             name: twenty-db
             property: connectionString
         - key: REDIS_URL
           fromService:
             name: twenty-redis
             type: redis
             property: connectionString

     - type: web
       name: twenty-front
       env: static
       buildCommand: yarn install && yarn build
       staticPublishPath: ./dist

   databases:
     - name: twenty-db
       databaseName: twenty
       user: twenty

   services:
     - type: redis
       name: twenty-redis
       plan: starter
   ```

3. **Deploy**
   - Click "Apply"
   - Wait for deployment

### Railway

1. **Create Project**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

2. **Add Services**
   ```bash
   railway add --database postgres
   railway add --database redis
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### AWS (ECS)

See detailed AWS deployment guide in [AWS Deployment](./docs/aws-deployment.md).

## Post-Deployment

### 1. Verify Deployment

```bash
# Check services
curl https://your-domain.com/health

# Test GraphQL
curl -X POST https://your-domain.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'
```

### 2. Create Admin User

```bash
# Via Docker Compose
docker-compose exec server yarn cli user:create \
  --email admin@your-domain.com \
  --password your-password \
  --role admin

# Via Kubernetes
kubectl exec -it -n twenty deployment/twenty-server -- \
  yarn cli user:create \
  --email admin@your-domain.com \
  --password your-password \
  --role admin
```

### 3. Configure Backups

```bash
# PostgreSQL backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U twenty twenty > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### 4. Set Up Monitoring

See [Monitoring Guide](./20-monitoring.md) for details.

## Maintenance

### Updates

```bash
# Docker Compose
docker-compose pull
docker-compose up -d

# Kubernetes
kubectl set image deployment/twenty-server \
  server=twentycrm/twenty:latest \
  -n twenty
```

### Scaling

```bash
# Docker Compose (edit docker-compose.yml)
server:
  deploy:
    replicas: 3

# Kubernetes
kubectl scale deployment twenty-server --replicas=5 -n twenty
```

### Rollback

```bash
# Kubernetes
kubectl rollout undo deployment/twenty-server -n twenty
```

## Troubleshooting

See [Troubleshooting Guide](./26-troubleshooting.md) for common deployment issues.

## Next Steps

- [Configuration](./19-configuration.md)
- [Monitoring](./20-monitoring.md)
- [Troubleshooting](./26-troubleshooting.md)

---

**Related Documentation:**
- [Development Setup](./03-development-setup.md)
- [System Architecture](./04-system-architecture.md)

