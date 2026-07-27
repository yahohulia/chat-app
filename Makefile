.PHONY: help up down build logs logs-frontend logs-backend logs-db clean clean-db restart db-reset db frontend-dev backend-dev install

help: ## Показати довідку по командам
	@echo "Доступні команди:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Підняти всі сервіси
	docker-compose up -d

down: ## Зупинити всі сервіси
	docker-compose down

build: ## Зібрати образи
	docker-compose build

logs: ## Перегляд логів всіх сервісів
	docker-compose logs -f

logs-frontend: ## Перегляд логів фронтенду
	docker-compose logs -f chat-frontend

logs-backend: ## Перегляд логів бекенду
	docker-compose logs -f chat-backend

logs-db: ## Перегляд логів бази даних
	docker-compose logs -f chat-db

clean: ## Очищення (volumes, images, containers)
	docker-compose down -v
	docker-compose rm -f
	docker system prune -f

clean-db: ## Очистити тільки базу даних (видалити volume)
	docker-compose down
	docker volume rm chat-app_chat-db-data 2>/dev/null || true
	docker-compose up -d chat-db

restart: ## Перезапуск сервісів
	docker-compose restart

db-reset: ## Перестворити всі таблиці бази даних (Sequelize sync force, знищує дані)
	docker-compose exec chat-backend node setup.js

db: ## Підключитися до бази даних через psql
	docker-compose exec chat-db psql -U chat_user -d chat_db

frontend-dev: ## Запуск фронтенду в dev режимі (локально)
	cd frontend && npm run dev

backend-dev: ## Запуск бекенду в dev режимі (локально)
	cd backend && npm start

install: ## Встановити залежності для фронтенду та бекенду
	cd frontend && npm install
	cd backend && npm install
