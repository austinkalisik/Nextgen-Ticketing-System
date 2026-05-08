# Nextgen Ticketing System

Laravel + React service desk for Nextgen Technology Limited.

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
- Git

## Clone and Run

```bash
git clone https://github.com/austinkalisik/Nextgen-Ticketing-System.git
cd Nextgen-Ticketing-System
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Create the database in phpMyAdmin or MySQL:

```text
nextgens_ticketing_system
```

Then run:

```bash
php artisan migrate --seed
npm run build
php artisan serve --host=127.0.0.1 --port=8000
```

Open:

```text
http://127.0.0.1:8000
```

## Database Settings

The default `.env.example` is configured for local phpMyAdmin/XAMPP-style MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nextgens_ticketing_system
DB_USERNAME=root
DB_PASSWORD=
```

If your MySQL user has a password, update `DB_PASSWORD` in `.env`.

## Development Mode

Run Laravel and Vite in separate terminals:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

```bash
npm run dev
```

If Vite file watching fails on a network drive, this repo already uses polling in `vite.config.js`.

## Production Build

```bash
npm run build
```

## Reset Demo Data

This will drop and recreate all tables, then reload sample tickets:

```bash
php artisan migrate:fresh --seed
```

## Useful Commands

```bash
php artisan test
php artisan config:clear
php artisan route:list
npm run build
```

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

## Troubleshooting

- `SQLSTATE[HY000] [1049] Unknown database`: create `nextgens_ticketing_system` in phpMyAdmin first.
- `Access denied for user 'root'`: update `DB_USERNAME` and `DB_PASSWORD` in `.env`.
- `Vite manifest not found`: run `npm run build`, or run `npm run dev` while using the app.
- App still using old database settings: run `php artisan config:clear`.
