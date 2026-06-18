# Docker & Deployment Guide

## Architecture Integration

The ZK-WaveScout Coordinator integrates with three other repositories:

```
┌──────────────────────────────────────────────────────────┐
│          zk-wavescout-coordinator (this service)         │
│  - Streams Stellar events                                │
│  - Decrypts solutions                                    │
│  - Opens GitHub PRs                                     │
└──────────────────────────────────────────────────────────┘
         ▲                           │
         │                           ▼
    Event Stream            GitHub API Calls
         │                           │
         ▼                           ▼
┌──────────────────────┐    ┌─────────────────┐
│ zk-wavescout-        │    │  GitHub Repo    │
│ contracts            │    │  (target repo)  │
│ (Soroban)            │    └─────────────────┘
└──────────────────────┘

Contributor Workflow:
1. zk-wavescout-frontend → Generates ZK proof
2. → Calls zk-wavescout-contracts → Emits bounty_claimed
3. → coordinator (this service) → Opens PR in GitHub
```

## Docker Build & Run

### Build Image

```bash
docker build -t zk-wavescout-coordinator:latest .
```

### Run Container

```bash
docker run -p 5000:5000 \
  -e CONTRACT_ADDRESS=GXXXX... \
  -e KDF_SALT=<64-hex-chars> \
  -e GITHUB_TOKEN=ghp_... \
  -e GITHUB_OWNER=myorg \
  -e GITHUB_REPO=my-repo \
  zk-wavescout-coordinator:latest
```

### Docker Compose (Local Development)

```bash
# Create .env.local with credentials
cat > .env.local << EOF
CONTRACT_ADDRESS=GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7
KDF_SALT=$(openssl rand -hex 32)
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=testuser
GITHUB_REPO=test-repo
EOF

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f coordinator

# Stop all services
docker-compose down
```

## Production Deployment

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zk-wavescout-coordinator
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: zk-wavescout-coordinator
  template:
    metadata:
      labels:
        app: zk-wavescout-coordinator
    spec:
      containers:
      - name: coordinator
        image: zk-wavescout/coordinator:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: production
        - name: CONTRACT_ADDRESS
          valueFrom:
            secretKeyRef:
              name: zk-wavescout-secrets
              key: contract-address
        - name: KDF_SALT
          valueFrom:
            secretKeyRef:
              name: zk-wavescout-secrets
              key: kdf-salt
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: zk-wavescout-secrets
              key: github-token
        - name: GITHUB_OWNER
          valueFrom:
            configMapKeyRef:
              name: zk-wavescout-config
              key: github-owner
        - name: GITHUB_REPO
          valueFrom:
            configMapKeyRef:
              name: zk-wavescout-config
              key: github-repo
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: zk-wavescout-coordinator
spec:
  selector:
    app: zk-wavescout-coordinator
  ports:
  - protocol: TCP
    port: 5000
    targetPort: 5000
  type: ClusterIP
```

### AWS ECS Task Definition

```json
{
  "family": "zk-wavescout-coordinator",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "coordinator",
      "image": "account-id.dkr.ecr.region.amazonaws.com/zk-wavescout-coordinator:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "LOG_LEVEL",
          "value": "info"
        }
      ],
      "secrets": [
        {
          "name": "CONTRACT_ADDRESS",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:zk-wavescout/contract-address"
        },
        {
          "name": "KDF_SALT",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:zk-wavescout/kdf-salt"
        },
        {
          "name": "GITHUB_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:zk-wavescout/github-token"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/zk-wavescout-coordinator",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Multi-Service Integration

### Local Development Setup

```bash
# Clone all repos
mkdir zk-wavescout && cd zk-wavescout
git clone https://github.com/zk-wavescout/zk-wavescout-circuits
git clone https://github.com/zk-wavescout/zk-wavescout-contracts
git clone https://github.com/zk-wavescout/zk-wavescout-coordinator
git clone https://github.com/zk-wavescout/zk-wavescout-frontend

# Setup coordinator
cd zk-wavescout-coordinator
cp .env.example .env
# Fill in CONTRACT_ADDRESS from zk-wavescout-contracts deployment
npm install
npm run dev

# In another terminal, start frontend
cd ../zk-wavescout-frontend
npm install
npm run dev

# Contracts should be deployed to Stellar testnet
cd ../zk-wavescout-contracts
npm run deploy:testnet
```

### Environment Variables Required

```bash
# Soroban Contract Address (from zk-wavescout-contracts)
CONTRACT_ADDRESS=GXXXX...

# KDF Salt (generate with: openssl rand -hex 32)
KDF_SALT=<64-hex-characters>

# GitHub (for PR opening)
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-org
GITHUB_REPO=solutions-repo

# Optional
GITHUB_BASE_BRANCH=main
NODE_ENV=production
LOG_LEVEL=info
PORT=5000
```

## Health Monitoring

### Check Service Status

```bash
# Local
curl http://localhost:5000/health

# Docker
docker exec <container-id> curl http://localhost:5000/health

# Kubernetes
kubectl get pods -l app=zk-wavescout-coordinator
kubectl logs deployment/zk-wavescout-coordinator -f
```

### View Metrics

```bash
curl http://localhost:5000/metrics | jq
```

## Troubleshooting

### Container won't start

```bash
docker logs <container-id>
# Check: CONTRACT_ADDRESS, KDF_SALT, GITHUB_TOKEN are set
```

### Can't connect to Stellar

```bash
docker exec <container-id> curl https://horizon-testnet.stellar.org
# Verify network connectivity
```

### GitHub API errors

```bash
# Verify token has 'repo' scope
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

## Scaling Considerations

- **Stateless design** — Multiple coordinator instances can run in parallel
- **Event deduplication** — Prevents duplicate PR creation from replay attacks
- **Rate limiting** — Built-in per-IP rate limiting
- **Graceful shutdown** — Proper signal handling for zero-downtime deployments

## Security Best Practices

1. **Secrets Management** — Use AWS Secrets Manager, Kubernetes Secrets, or HashiCorp Vault
2. **Network Isolation** — Run coordinator in private subnet with NAT for outbound
3. **GitHub Token** — Use read-only token if possible, rotate regularly
4. **KDF_SALT** — Rotate periodically and store securely
5. **Monitoring** — Alert on error rate spikes or event processing delays
