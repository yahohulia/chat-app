# 💬 Chat App - Real-Time Private Messaging

A full-featured real-time chat application. The project includes a Vue 3 frontend, an Express backend with Socket.io, and a PostgreSQL database (via Sequelize) - everything runs through Docker Compose.

## 🚀 Live Demo

**Check it**: _Not deployed yet_

## 🏅 Features

- **Private rooms** - a room is fully hidden from anyone the owner hasn't added; membership actually gates access (room list, message history, socket channels), not just a hidden button in the UI.
- **Leak-free realtime** - instead of a global broadcast, each client identifies itself after connecting, and Socket.io events are sent only to that user's personal channel - outsiders never receive events about a room they're not in.
- **Ownership model** - the owner manages the room (rename/delete/add members), members can chat and leave on their own.
- **Optimistic UI** - room actions (create/rename/delete) apply immediately from the server response instead of waiting for a socket echo, so the UI never stalls even if the connection briefly drops.
- **Docker Compose out of the box** - one `docker compose up` brings up the frontend, backend, and PostgreSQL together.
- **Deploy-ready** - `render.yaml` and `vercel.json` are already in the repo for a Vercel + Render + Neon setup.

## 💻 Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logo=pinia&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 🏗️ Architecture

```
chat-app/
├── frontend/          # Vue 3 + Pinia + Vite app
├── backend/           # Express API + Socket.io + Sequelize (PostgreSQL)
├── docker-compose.yml # Orchestrates all services
├── render.yaml         # Render blueprint for the backend
├── vercel.json         # Vercel build config for the frontend
├── Makefile             # Convenience commands
└── README.md            # Documentation
```

## 🪄 Installation & Setup

### Clone the repository:

```bash
git clone <repository-url>
cd chat-app
```

### Copy the example config:

```bash
cp env.example .env
```

### Bring up the whole stack:

```bash
docker compose up -d --build
  # or
make up
```

### Create the database tables (once, on first run):

```bash
docker compose exec chat-backend node setup.js
```

## 🛠️ Commands

### Makefile commands

| Command              | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `make up`            | Start all services in the background                      |
| `make down`          | Stop all services                                         |
| `make build`         | Build Docker images                                       |
| `make logs`          | View logs for all services                                |
| `make logs-frontend` | Frontend logs only                                        |
| `make logs-backend`  | Backend logs only                                         |
| `make logs-db`       | Database logs only                                        |
| `make restart`       | Restart all services                                      |
| `make clean`         | Full cleanup (volumes, images, containers)                |
| `make clean-db`      | Remove only the database volume                           |
| `make db-reset`      | Recreate all tables (Sequelize sync force, destroys data) |
| `make db`            | Connect to PostgreSQL via psql                            |
| `make install`       | Install dependencies locally                              |
| `make frontend-dev`  | Run the frontend locally (without Docker)                 |
| `make backend-dev`   | Run the backend locally (without Docker)                  |

### Docker Compose commands

```bash
# Start
docker compose up -d              # Start in the background
docker compose up -d --build      # Build and start

# Stop
docker compose down               # Stop and remove containers
docker compose stop               # Stop only

# Logs
docker compose logs -f            # All logs
docker compose logs -f chat-backend  # Logs for a specific service

# Restart
docker compose restart            # All services
docker compose restart chat-backend  # A specific service
```

## 🔧 Configuration

`env.example` holds the example config - copy it to `.env` before running. `POSTGRES_*` variables configure the database container, while `DB_*`/`PORT`/`CLIENT_HOST` are read directly by `backend/src` (via dotenv), including when running locally without Docker.
