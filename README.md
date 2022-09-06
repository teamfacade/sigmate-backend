# Sigmate Backend

Server side code for sigmate services.

## Prerequisites

### MySQL Server

#### macOS (Homebrew)

```bash
brew install mysql
mysql_secure_installation
mysql.server start
```

#### Windows

Download MySQL server ([community edition](https://dev.mysql.com/downloads/mysql/))

## Requirements

### Install Node packages

```bash
npm install
```

### Generate key pairs for token signing

```bash
# Generate the keys
git clone https://github.com/teamfacade/sigmate-security.git
cd sigmate-security
cd jwt-secret
./gen-jwt-secret.sh

# Move the keys to the correct location
mkdir $SIGMATE_BACKEND_PATH/keys
mv *.pem $SIGMATE_BACKEND_PATH/keys/
```

### Set the environment variables

```bash
NODE_ENV=
PORT=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
DB_HOST=
DB_PORT=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PATH_PUBLIC_KEY=keys/cert.pem
PATH_PRIVATE_KEY=keys/private-key.pem
```

### Create database

Create a database as with the same name as the environment variable `DB_DATABASE`. Replace `DB_DATABASE` with the actual database name.

```SQL
CREATE DATABASE `DB_DATABASE`;
```

## Running

### Development Build (Slower)

Uses [ts-node](https://www.npmjs.com/package/ts-node) and [nodemon](https://www.npmjs.com/package/nodemon) to compile Typescript in just-in-time, and automatically re-build and restart the server on code change.

```bash
npm run dev
```

### Production Build (Faster)

Compile the entire Typescript code base into JavaScript before running the server. Longer build times are expected, but the server is more responsive.

```bash
npm run build
npm run start
```
