# njs-assmt

# Project Setup and Documentation

This document outlines the steps taken to set up the project, including database configuration, migrations, and seeding.

## 1. Environment Configuration

A `.env` file was created with the following content:

```dotenv
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PORT=3306
MYSQL_PASSWORD=1234
MYSQL_DATABASE=njs

PORT=3030
JWT_SECRET=a_very_secret_key_that_should_be_changed_in_production
```

## 2. Database Setup

The database named `njs` was created. This step was performed manually by the user as the `mysql` command was not available in the execution environment.

## 3. Database Migrations

Sequelize CLI migrations were executed to ensure the database schema is up to date. The command used was:

```bash
npx sequelize-cli db:migrate --config config/config.js --migrations-path migrations
```

The output indicated that the database schema was already up to date.

## 4. Database Seeding

Sequelize CLI seeds were executed to populate the database with initial data. The commands executed were:

```bash
npx sequelize-cli db:seed:all --config config/config.js --migrations-path seeders
```

This successfully migrated the `add-destinations` and `add-accounts` seed files.

## Next Steps

- Ensure the `MYSQL_PASSWORD` in the `.env` file is changed to a secure value for production environments.
- Review the `README.md` file for any further setup instructions or project details.
