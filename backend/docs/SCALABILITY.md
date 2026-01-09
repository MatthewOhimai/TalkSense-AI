# TalkSense AI - Production Scalability Guide

This document outlines the strategy for scaling TalkSense AI to handle production loads.

## 1. API Scalability (Django/DRF)

### Rate Limiting

Global rate limits are enforced in `settings.py`:

- **Anonymous Users**: 100 requests / day
- **Authenticated Users**: 1000 requests / day

For specific high-load endpoints (e.g., chat), use the `@throttle_classes` decorator to apply stricter limits if needed.

### Horizontal Scaling

- Use a production-grade WSGI server like **Gunicorn** or **uWSGI**.
- Deploy behind an Nginx reverse proxy.
- Deploy Django containers in a cluster (Kubernetes or AWS ECS).
- Ensure a Load Balancer (ELB/ALB) distributes traffic evenly.

## 2. Worker Scalability (Celery)

### Concurrency

The `CELERY_WORKER_CONCURRENCY` setting controls the number of concurrent processes per worker. In production, this should match the number of CPU cores available to the worker container.

### Autoscaling Workers

To autoscale workers based on queue depth:

1. **Monitor Redis**: Use a tool like `prometheus-celery-exporter`.
2. **KEDA (Kubernetes)**: Use KEDA to scale Celery workers based on the number of messages in the Redis list `celery`.
3. **AWS Auto Scaling**: Use CloudWatch alarms on the Redis `set_size` for the `celery` queue to trigger Lambda functions that scale the ECS service.

## 3. Database & Cache

### Database (PostgreSQL)

Transition from SQLite to PostgreSQL for production.

- Use **RDS Managed Database** for automated backups and multi-AZ failover.
- Implement read-replicas if query load is high.

### Cache (Redis)

Use a managed Redis instance (e.g., AWS ElastiCache).

- Separate the Celery broker from the application cache if possible.
- Use Redis Sentinel or Cluster for high availability.

## 4. LLM Service (Gemini)

The application uses the Google Gemini API.

- **Quotas**: Monitor Google Cloud Project quotas.
- **Failover**: The `LLMService` implements exponential backoff for transient 500 errors.
- **Fallbacks**: Ensure a "service busy" message is shown to users if the API is completely down.
