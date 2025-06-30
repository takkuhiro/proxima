include .env

.PHONY: vet
vet:
	uv run ruff format .
	uv run ruff check . --fix
	uv run mypy .


.PHONY: deploy
deploy:
	uv run adk deploy agent_engine \
		--env_file .env --project $(PROJECT_ID) \
		--region $(GOOGLE_CLOUD_LOCATION) \
		--staging_bucket $(GOOGLE_CLOUD_STORAGE_BUCKETS) \
		--display_name proxima-agent \
		proxima

.PHONY: test
test:
	uv run adk eval proxima proxima/evalset72790.evalset.json