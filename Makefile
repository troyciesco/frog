.PHONY: frog

frog:
	docker compose --project-name frog up -d --build

redis:
	docker compose --project-name frog up -d redis
