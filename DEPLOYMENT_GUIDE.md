# 🚀 DEPLOYMENT & PRODUCTION GUIDE

## Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Install production dependencies
pip install -r requirements.txt

# Verify all API keys are set
echo "Checking API keys..."
grep "GEMINI_API_KEY" .env  # Must not be empty
grep "SECRET_KEY" .env       # Must not be empty

# Use PostgreSQL instead of SQLite
# Update DATABASES setting in settings.py
```

### 2. Security Configuration
```python
# settings.py changes for production

# 1. Disable debug mode
DEBUG = False

# 2. Set secure secret key (generate if needed)
SECRET_KEY = os.getenv('SECRET_KEY')

# 3. Configure ALLOWED_HOSTS
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')

# 4. Set SECURE settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# 5. Set CORS properly
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]

# 6. Database connection pooling
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,  # Connection pooling
    }
}
```

### 3. Database Migration
```bash
# Run migrations on production server
python manage.py migrate

# Create superuser for admin
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### 4. Vector Store Setup
```bash
# On production server, seed the knowledge base
python manage.py shell

# Or run the seeding script
python manage.py shell < chat/seed_vector_store.py

# Verify FAISS index was created
ls -la faiss_index.bin faiss_docs.pkl
```

---

## Deployment Options

### Option 1: Docker (Recommended)

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "talksense.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--worker-tmp-dir", "/dev/shm"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: talksense
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  web:
    build: .
    command: gunicorn talksense.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend:/app
      - faiss_data:/app/faiss_data
    ports:
      - "8000:8000"
    environment:
      DEBUG: "False"
      DATABASE_URL: postgresql://postgres:secret@db:5432/talksense
      CELERY_BROKER_URL: redis://redis:6379/0
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - db
      - redis

  celery:
    build: .
    command: celery -A talksense worker -l info
    volumes:
      - ./backend:/app
    environment:
      DEBUG: "False"
      CELERY_BROKER_URL: redis://redis:6379/0
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  faiss_data:
```

Deploy:
```bash
docker-compose build
docker-compose up -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

---

### Option 2: Traditional Server (Ubuntu/Debian)

```bash
# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv postgresql redis-server nginx

# 2. Clone repository
cd /var/www
git clone https://github.com/yourepo/talksense-ai.git
cd talksense-ai

# 3. Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# 4. Install Python packages
cd backend
pip install -r requirements.txt

# 5. Create .env file
cp .env.example .env
nano .env  # Edit with your values

# 6. Run migrations
python manage.py migrate
python manage.py createsuperuser

# 7. Collect static files
python manage.py collectstatic --noinput

# 8. Create systemd service
sudo nano /etc/systemd/system/talksense.service
```

`/etc/systemd/system/talksense.service`:
```ini
[Unit]
Description=TalkSense AI Django Application
After=network.target postgresql.service redis.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/talksense-ai/backend
Environment="PATH=/var/www/talksense-ai/venv/bin"
ExecStart=/var/www/talksense-ai/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind unix:/var/www/talksense-ai/talksense.sock \
    talksense.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable talksense
sudo systemctl start talksense
```

---

### Option 3: PaaS (Heroku/Railway/Render)

`.procfile`:
```
web: gunicorn talksense.wsgi --log-file -
worker: celery -A talksense worker -l info
beat: celery -A talksense beat -l info
release: python manage.py migrate
```

`runtime.txt`:
```
python-3.11.6
```

Deploy:
```bash
# Heroku
heroku create talksense-ai
heroku config:set GEMINI_API_KEY=...
git push heroku main

# Railway/Render (via UI)
```

---

## Production Monitoring

### Logging Configuration

Add to `settings.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/talksense/error.log',
        },
        'sentry': {
            'level': 'ERROR',
            'class': 'sentry_sdk.integrations.logging.EventHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
        'chat': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Sentry Error Tracking
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=False
)
```

### Performance Monitoring

```python
# Install django-extensions
# Add slow query logging

LOGGING = {
    'loggers': {
        'django.db.backends': {
            'handlers': ['file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
        },
    },
}

# Monitor vector store size
def check_faiss_size():
    from chat.services.vector_store import VectorStore
    store = VectorStore()
    stats = store.get_stats()
    print(f"FAISS Index: {stats['index_size']} documents")
    if stats['index_size'] > 100000:
        # Alert: Consider optimization
        pass
```

---

## Scaling Recommendations

### 1. Database
```
Current: SQLite
Production: PostgreSQL with:
  - Connection pooling (PgBouncer)
  - Replication
  - Automatic backups
  - Read replicas for analytics
```

### 2. Vector Store
```
Current: FAISS (CPU)
Scale: 
  - Use FAISS-GPU for faster inference
  - Shard vectors across machines
  - Use Milvus or Weaviate for distributed search
```

### 3. Cache Layer
```
Current: None
Add:
  - Redis for session caching
  - Query result caching
  - Chat history caching
```

### 4. Message Queue
```
Current: Redis
Optimize:
  - Use RabbitMQ for reliability
  - Implement message prioritization
  - Add dead letter queues
```

### 5. API Gateway
```
Add:
  - nginx/HAProxy for load balancing
  - Rate limiting
  - Request caching
  - Compression
```

---

## Backup & Disaster Recovery

### Database Backups
```bash
# Automated PostgreSQL backup
#!/bin/bash
BACKUP_DIR="/var/backups/talksense"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump talksense > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://talksense-backups/
```

### Vector Store Backup
```bash
# Backup FAISS index
#!/bin/bash
BACKUP_DIR="/var/backups/talksense"
DATE=$(date +%Y%m%d_%H%M%S)

cp faiss_index.bin $BACKUP_DIR/faiss_$DATE.bin
cp faiss_docs.pkl $BACKUP_DIR/faiss_$DATE.pkl

# Upload to S3
aws s3 cp $BACKUP_DIR/faiss_$DATE.bin s3://talksense-backups/
aws s3 cp $BACKUP_DIR/faiss_$DATE.pkl s3://talksense-backups/
```

---

## Performance Tuning

### Django Settings
```python
# Optimize query performance
DATABASES = {
    'default': {
        'ATOMIC_REQUESTS': True,
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}

# Caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Session caching
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

### Gunicorn Configuration
```
gunicorn talksense.wsgi:application \
    --workers 4 \              # CPU cores × 2
    --worker-class sync \
    --worker-tmp-dir /dev/shm \
    --max-requests 1000 \      # Prevent memory leaks
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    --bind 0.0.0.0:8000
```

---

## Monitoring & Alerts

### Key Metrics to Monitor
```
1. API Response Time
   - Target: <500ms for most endpoints
   - Alert: >1000ms

2. Error Rate
   - Target: <0.1%
   - Alert: >1%

3. Vector Store Size
   - Target: <1GB per 100k docs
   - Alert: Approaching capacity

4. Database Connections
   - Target: <50 active
   - Alert: >100

5. Cache Hit Rate
   - Target: >80%
   - Alert: <60%

6. Token Usage
   - Track daily/monthly
   - Alert: Approaching quota
```

### New Relic/DataDog Setup
```python
import newrelic.agent

# settings.py
MIDDLEWARE = [
    'newrelic.agent.wsgi.NewRelicWSGIMiddleware',
    # ... other middleware
]

newrelic.agent.initialize()
```

---

## Post-Deployment

### 1. Verify Services
```bash
# Check Django
curl http://localhost:8000/api/docs/

# Check database
python manage.py shell
>>> from chat.models import ChatSession
>>> ChatSession.objects.count()

# Check vector store
python manage.py shell
>>> from chat.services.vector_store import VectorStore
>>> VectorStore().get_stats()
```

### 2. Load Test
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://yourdomain.com/api/chat/sessions/

# Using wrk
wrk -t12 -c400 -d30s http://yourdomain.com/api/chat/sessions/
```

### 3. Security Audit
```bash
# Run Django checks
python manage.py check --deploy

# SSL certificate
certbot certonly --nginx -d yourdomain.com

# Firewall rules
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## Troubleshooting Production Issues

### High Latency on AI Responses
```
1. Check Gemini API status
2. Increase Gemini quota
3. Add response caching
4. Reduce context window size (fewer retrieved docs)
```

### Vector Store Issues
```
1. Monitor faiss_index.bin size
2. Check disk space
3. Verify file permissions
4. Rebuild index if corrupted:
   python manage.py shell
   >>> from chat.services.rag_service import RAGService
   >>> RAGService().clear_vector_store()
```

### Memory Leaks
```
1. Set gunicorn max-requests
2. Monitor FAISS index memory
3. Clear old embeddings periodically
4. Use memory profiling tools
```

---

## Success! 🎉

Your TalkSense AI backend is now production-ready!

**Next Steps:**
1. Deploy frontend
2. Setup monitoring
3. Configure backups
4. Implement analytics
5. Scale as needed

**Estimated Capacity:**
- Single instance: ~500 concurrent users
- Distributed: Scale to millions

Good luck! 🚀
