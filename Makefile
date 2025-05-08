.PHONY: frog down redis redis-down copy-env setup

frog:
	docker compose --project-name frog up -d --build

down:
	docker compose --project-name frog down

redis:
	docker compose --project-name frog up -d redis

redis-down:
	docker compose --project-name frog down --volumes redis

copy-env:
	./copy-env.sh

setup:
	cd client && yarn install
	cd server && yarn install
	cd worker && yarn install
