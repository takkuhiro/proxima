include .env

ARTIFACT_REGISTRY=$(GOOGLE_CLOUD_REGION)-docker.pkg.dev/$(GOOGLE_CLOUD_PROJECT)/$(REPOSITORY)
IMAGE_PATH=${ARTIFACT_REGISTRY}/$(IMAGE):latest

.PHONY: vet
vet:
	uv run ruff format .
	uv run ruff check . --fix
	uv run mypy .

.PHONY: connpass
connpass:
	curl -X GET "https://connpass.com/api/v2/events/?keyword=python" \
		-H "X-API-Key: $(CONNPASS_API_KEY)"
