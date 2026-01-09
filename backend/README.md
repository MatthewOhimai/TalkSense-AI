# TalkSense-AI Backend

This is the Django backend for the TalkSense-AI application.

## Prerequisites

- Python 3.10+
- Redis (for Celery)

## Setup

1.  Create virtual environment:

    ```bash
    python -m venv venv
    venv\Scripts\activate
    ```

2.  Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3.  Environment Variables:

    - Copy `.env.example` to `.env`.
    - Populate the API keys.

4.  Run Migrations:

    ```bash
    python manage.py migrate
    ```

5.  Run Server:

    ```bash
    python manage.py runserver
    ```

6.  Run Celery:
    ```bash
    celery -A talksense worker --loglevel=info
    ```
