include .env

ENV_VARS=PROJECT_ID=$(PROJECT_ID),DB_REGION=$(DB_REGION),DB_INSTANCE_NAME=$(DB_INSTANCE_NAME),DB_NAME=$(DB_NAME),DB_USER=$(DB_USER),DB_PASSWORD=$(DB_PASSWORD),DB_HOST=$(DB_HOST),DB_PORT=$(DB_PORT),GOOGLE_API_KEY=$(GOOGLE_API_KEY),CONNPASS_API_KEY=$(CONNPASS_API_KEY),NIJIVOICE_API_KEY=$(NIJIVOICE_API_KEY),NEWS_GCS_BUCKET_NAME=$(NEWS_GCS_BUCKET_NAME)
ID_TOKEN=xxx # gcloud auth print-access-token

.PHONY: vet
vet:
	uv run ruff format .
	uv run ruff check . --fix
	uv run mypy .

# デプロイ時は以下に追加して、コンソールからCloud SQL connectionを設定する
.PHONY: deploy.crawl.events
deploy.crawl.events:
	uv pip freeze > requirements.txt
	gcloud functions deploy crawl-events \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point crawl_events_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)

.PHONY: scheduler.create.crawl.events
scheduler.create.crawl.events:
	gcloud scheduler jobs create http crawl-events-job \
		--schedule "0 5 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/crawl-events \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: scheduler.update.crawl.events
scheduler.update.crawl.events:
	gcloud scheduler jobs update http crawl-events-job \
		--schedule "0 5 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/crawl-events \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--update-headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: deploy.create.quest
deploy.create.quest:
	uv pip freeze > requirements.txt
	gcloud functions deploy create-quest \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point create_quest_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)

.PHONY: scheduler.create.quest
scheduler.create.quest:
	gcloud scheduler jobs create http create-quest-job \
		--schedule "0 5 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/create-quest \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: scheduler.update.quest
scheduler.update.quest:
	gcloud scheduler jobs update http create-quest-job \
		--schedule "0 5 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/create-quest \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--update-headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: deploy.manuscript
deploy.manuscript:
	uv pip freeze > requirements.txt
	gcloud functions deploy manuscript \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point manuscript_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)

.PHONY: scheduler.create.manuscript
scheduler.create.manuscript:
	gcloud scheduler jobs create http create-manuscript-job \
		--schedule "0 6 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/manuscript \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: scheduler.update.manuscript
scheduler.update.manuscript:
	gcloud scheduler jobs update http create-manuscript-job \
		--schedule "0 6 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/manuscript \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--update-headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: test
test:
	curl -X POST "$(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/manuscript" \
		-H "Authorization: bearer $(ID_TOKEN)" \
		-H "Content-Type: application/json" \
		-d '{"user_id": "dV6p8W3fLHhfgi1ixyqdvLOu6Kt2"}'

.PHONY: localfunc
localfunc:
	uv run functions-framework --target news_entry_point

.PHONY: localtest
localtest:
	curl -X POST "http://0.0.0.0:8080" \
		-H "Authorization: bearer ${ID_TOKEN}" \
		-H "Content-Type: application/json" \
		-d '{}'

.PHONY: deploy.iot.speak
deploy.iot.speak:
	uv pip freeze > requirements.txt
	gcloud functions deploy iot-speak \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point send_request_iot_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)

.PHONY: scheduler.iot.speak
scheduler.iot.speak:
	gcloud scheduler jobs create http iot-speak \
		--schedule "0 12 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/iot-speak \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: scheduler.update.iot.speak
scheduler.update.iot.speak:
	gcloud scheduler jobs update http iot-speak \
		--schedule "0 12 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/iot-speak \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--update-headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: deploy.create.initiatives
deploy.create.initiatives:
	uv pip freeze > requirements.txt
	gcloud functions deploy create-initiatives \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point create_initiatives_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)

.PHONY: deploy.save.old.memory
deploy.save.old.memory:
	uv pip freeze > requirements.txt
	gcloud functions deploy save-old-memory \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point save_old_memory_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)

.PHONY: scheduler.save.old.memory
scheduler.save.old.memory:
	gcloud scheduler jobs create http save-old-memory \
		--schedule "0 5 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/save-old-memory \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: scheduler.update.save.old.memory
scheduler.update.save.old.memory:
	gcloud scheduler jobs update http save-old-memory \
		--schedule "0 5 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/save-old-memory \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--update-headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: deploy.advice
deploy.advice:
	uv pip freeze > requirements.txt
	gcloud functions deploy advice \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point advice_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)

.PHONY: scheduler.advice
scheduler.advice:
	gcloud scheduler jobs create http advice \
		--schedule "0 19 * * 5" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/advice \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: scheduler.update.advice
scheduler.update.advice:
	gcloud scheduler jobs update http advice \
		--schedule "0 19 * * 5" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/advice \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--update-headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: deploy.routine
deploy.routine:
	uv pip freeze > requirements.txt
	gcloud functions deploy routine \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point routine_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)

.PHONY: scheduler.routine
scheduler.routine:
	gcloud scheduler jobs create http routine \
		--schedule "0 5 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/routine \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: scheduler.update.routine
scheduler.update.routine:
	gcloud scheduler jobs update http routine \
		--schedule "0 5 * * *" \
		--time-zone Asia/Tokyo \
		--http-method=POST \
		--uri $(GOOGLE_CLOUD_RUN_FUNCTIONS_URI)/routine \
		--attempt-deadline '10m' \
		--message-body '{}' \
		--update-headers Content-Type=application/json \
		--oidc-service-account-email=$(SCHEDULER_SERVICE_ACCOUNT)

.PHONY: deploy.news
deploy.news:
	uv pip freeze > requirements.txt
	gcloud functions deploy news \
		--gen2 \
		--region asia-northeast1 \
		--runtime python312 \
		--trigger-http \
		--allow-unauthenticated \
		--source . \
		--entry-point news_entry_point \
		--service-account=$(PROXIMA_SERVICE_ACCOUNT) \
		--timeout=10m \
		--memory=1Gi \
		--set-env-vars $(ENV_VARS)