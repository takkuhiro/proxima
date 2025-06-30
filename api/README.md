# FastAPI サーバー

Frontend と Agent Engine を繋ぐ処理を行うFastAPIサーバー

webからのFirestoreへの書き込みをEventarcが検知し、このFastAPIサーバーにリクエストが送られる。
このサーバーでは Agent Engine にリクエストを送り、取得した応答をFirestoreに書き込む。

### Local
```
uv run uvicorn main:app --host 0.0.0.0 --port 8080
```

### Deployment
```

# api
ARTIFACT_REGISTRY=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}
IMAGE_PATH=${ARTIFACT_REGISTRY}/${IMAGE}:${TAG}

docker build --platform linux/amd64 -t ${IMAGE_PATH} .
docker push ${IMAGE_PATH}

ENV_VARS=$(grep -v '^#' .env | grep -v '^$' | xargs | sed 's/ /,/g')
gcloud run deploy proxima-api \
    --image ${IMAGE_PATH} \
    --service-account proxima-sa@${PROJECT_ID}.iam.gserviceaccount.com \
    --allow-unauthenticated \
    --region asia-northeast1 \
    --set-env-vars=${ENV_VARS}

# tool
ARTIFACT_REGISTRY=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}
IMAGE_PATH=${ARTIFACT_REGISTRY}/${IMAGE}:${TAG}

docker build --platform linux/amd64 -t ${IMAGE_PATH} -f Dockerfile_tool .
docker push ${IMAGE_PATH}

ENV_VARS=$(grep -v '^#' .env | grep -v '^$' | xargs | sed 's/ /,/g')
gcloud run deploy proxima-tool \
    --image ${IMAGE_PATH} \
    --service-account your-sa@${PROJECT_ID}.iam.gserviceaccount.com \
    --allow-unauthenticated \
    --region asia-northeast1 \
    --set-env-vars=${ENV_VARS}
```

### Linter and Formatter
```
uv run ruff format .
uv run ruff check . --fix
uv run mypy . --no-site-packages
```
