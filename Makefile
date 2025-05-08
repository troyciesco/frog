.PHONY: frog down redis redis-down

frog:
	docker compose --project-name frog up -d --build

down:
	docker compose --project-name frog down

redis:
	docker compose --project-name frog up -d redis

redis-down:
	docker compose --project-name frog down --volumes redis
