# Nextgen Ticketing System

Laravel and React service desk for Nextgen Technology Limited.

## Features

- Ticket creation, update, deletion, search, and filtering
- SLA-aware dashboard metrics
- Service lines for Domain Hosting, Email Support, ISP / VSAT, AI CCTV Security, Document Management, and Software Engineering
- Ticket detail panel with activity comments
- MySQL/phpMyAdmin database configuration
- ERD and wireframe documentation in `docs/`

## Requirements

- PHP 8.3+
- Composer
- Node.js and npm
- MySQL or MariaDB

## Setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run build
php artisan serve --host=127.0.0.1 --port=8000
```

Open the app at:

```text
http://127.0.0.1:8000
```

## Database

Create this database in phpMyAdmin or MySQL before running migrations:

```text
nextgens_ticketing_system
```

Default local database settings are stored in `.env.example`.

## Documentation

- `docs/erd.md`
- `docs/wireframes.md`
- `docs/assets/nextgen-ticketing-concept.png`
- `docs/assets/implementation-desktop.png`
- `docs/assets/implementation-mobile.png`

## Verification

```bash
php artisan test
npm run build
```
