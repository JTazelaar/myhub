# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyHub is a personal task management web app built with Django 5 and PostgreSQL 16, containerized with Docker.

## Development Commands

### Running with Docker (recommended)
```bash
docker-compose up --build
```
App runs at http://localhost:8000/, admin at http://localhost:8000/admin/

### Running locally (without Docker)
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Tests
```bash
cd backend
python manage.py test tasks
```

### Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Architecture

Single Django app (`tasks`) using the standard MTV pattern:

- **Settings** are split into `backend/myhub/settings/` with `base.py`, `dev.py`, and `prod.py`. Docker Compose uses `myhub.settings.dev` by default.
- **Database config** uses `dj-database-url` to parse `DATABASE_URL` from environment variables (composed from individual POSTGRES_* vars in docker-compose).
- **Authentication** uses Django's built-in auth. All views require login; unauthenticated users redirect to `/admin/login/`.
- **Single model**: `Task` with title, notes, is_done, priority (1-5, lower=higher), due_date, and timestamps.
- **Two views**: `dashboard` (list/create tasks) and `toggle_task_done` (mark complete/incomplete). No REST API.
- **Templates** live in `backend/tasks/templates/tasks/`. The dashboard uses inline CSS with a dark theme and responsive layout (no frontend framework).
- **Environment variables** are defined in `.env` at the project root and consumed by docker-compose.
