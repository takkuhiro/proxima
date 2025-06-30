# Proxima Agent

Agent Development Kitを用いたProximaのAgentシステム

Google Cloud の Agent Engine にデプロイされる


### Deployment
```
# MCP Toolbox
cd proxima/mcp-toolbox
gcloud secrets create db-tools --data-file=tools.yaml
gcloud run deploy db-toolbox \
	--image us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:latest \
	--service-account toolbox-identity \
	--region us-central1 \
	--set-secrets "/app/tools.yaml=db-tools:latest" \
	--args="--tools_file=/app/tools.yaml","--address=0.0.0.0","--port=8080" \
	--allow-unauthenticated

# Agent Engine
source .venv/bin/activate
uv run python deploy.py

# Cloud Run
ARTIFACT_REGISTRY=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}
IMAGE_PATH=${ARTIFACT_REGISTRY}/${IMAGE}:${TAG}

docker build --platform linux/amd64 -t ${IMAGE_PATH} .
docker push ${IMAGE_PATH}
gcloud run deploy proxima-agent-service \
	--source . \
	--region $GOOGLE_CLOUD_LOCATION \
	--project $GOOGLE_CLOUD_PROJECT \
	--allow-unauthenticated \
    --service-account service-account@${PROJECT_ID}.iam.gserviceaccount.com \
	--set-env-vars="GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT,GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION,GOOGLE_GENAI_USE_VERTEXAI=$GOOGLE_GENAI_USE_VERTEXAI,GOOGLE_CLOUD_STORAGE_BUCKETS=$GOOGLE_CLOUD_STORAGE_BUCKETS,GOOGLE_PROGRAMMABLE_SEARCH_API_KEY=$GOOGLE_PROGRAMMABLE_SEARCH_API_KEY,GOOGLE_PROGRAMMABLE_SEARCH_CSE_ID=$GOOGLE_PROGRAMMABLE_SEARCH_CSE_ID,MCP_TOOLBOX_URL=$MCP_TOOLBOX_URL,PROJECT_ID=$PROJECT_ID"
```

### Local
```
uv run adk web

# or

bash restapi.sh
```

### Linter and Formatter
```
uv run ruff format .
uv run ruff check . --fix
uv run mypy . --no-site-packages
```
