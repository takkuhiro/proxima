import json
import logging
import os
from datetime import datetime, timedelta, timezone

import google.auth
import google.auth.transport.requests
import requests
from dotenv import load_dotenv
from google.cloud import storage  # type: ignore

from common.db import fetch_latest_manuscript_from_manuscripts, update_manuscript_audio_to_db
from common.firestore import get_all_user_ids

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

NIJIVOICE_API_KEY = os.getenv("NIJIVOICE_API_KEY")
GCS_BUCKET_NAME = os.getenv("NEWS_GCS_BUCKET_NAME")

if not NIJIVOICE_API_KEY:
    raise ValueError("NIJIVOICE_API_KEY is not set")

if not GCS_BUCKET_NAME:
    raise ValueError("GCS_BUCKET_NAME is not set")


def _generate_voice_data(manuscript: str, character_id: str) -> bytes | None:
    """
    テキストを音声データに変換する
    """
    logger.info(f"Generating voice for manuscript: {manuscript[:30]}...")
    body = {
        "script": manuscript,
        "speed": "1.2",
        "format": "mp3",
    }
    try:
        response = requests.post(
            f"https://api.nijivoice.com/api/platform/v1/voice-actors/{character_id}/generate-voice",
            headers={"x-api-key": NIJIVOICE_API_KEY, "accept": "application/json", "content-type": "application/json"},
            data=json.dumps(body),
        )
        response.raise_for_status()

        audio_file_url = response.json().get("generatedVoice", {}).get("audioFileDownloadUrl")
        if not audio_file_url:
            logger.error(f"Could not find audioFileDownloadUrl in response: {response.json()}")
            return None

        logger.info(f"Downloading audio from にじボイス: {audio_file_url}")
        audio_response = requests.get(audio_file_url)
        audio_response.raise_for_status()

        return audio_response.content
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to generate or download voice data: {e}")
        return None


def _upload_to_gcs_and_get_signed_url(data: bytes, user_id: str, manuscript_id: str) -> tuple[str, str] | None:
    """
    音声データをGCSにアップロードし、署名付きURLを返す
    """
    try:
        storage_client = storage.Client(project=os.getenv("PROJECT_ID"))
        bucket = storage_client.get_bucket(str(GCS_BUCKET_NAME))

        jst = timezone(timedelta(hours=9))
        timestamp = datetime.now(jst).strftime("%Y%m%d%H%M%S")
        blob_name = f"news/{user_id}/{manuscript_id}_{timestamp}.mp3"

        blob = bucket.blob(blob_name)

        logger.info(f"Uploading voice to GCS: {blob_name}")
        blob.upload_from_string(data, content_type="audio/mpeg")
        logger.info(f"Uploaded voice to GCS: gs://{GCS_BUCKET_NAME}/{blob_name}")

        credentials, _ = google.auth.default()
        credentials.refresh(google.auth.transport.requests.Request())

        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(days=7),
            method="GET",
            service_account_email=credentials.service_account_email,
            access_token=credentials.token,
        )
        logger.info("Generated signed URL.")
        return blob_name, signed_url
    except Exception as e:
        logger.error(f"Failed to upload to GCS: {e}")
        return None


def create_news_audio(user_id: str | None = None) -> str:
    """
    ユーザーの最新の原稿から音声を生成し、GCSにアップロードする
    user_idは必須
    """
    if not user_id:
        user_ids = get_all_user_ids()
        for uid in user_ids:
            create_news_audio(uid)
        return "OK"

    logger.info(f"Starting news audio creation for user: {user_id}")

    manuscript = fetch_latest_manuscript_from_manuscripts(user_id)
    if not manuscript:
        logger.warning(f"No manuscript found for user: {user_id}")
        return "No manuscript found"

    voice_data = _generate_voice_data(manuscript.manuscript, manuscript.character_id)
    if not voice_data:
        logger.error(f"Failed to generate voice data for user {user_id}")
        return "Failed to generate voice"

    response = _upload_to_gcs_and_get_signed_url(voice_data, user_id, manuscript.id)
    if not response:
        logger.error(f"Failed to upload to GCS for user {user_id}")
        return "Failed to upload to GCS"
    blob_name, signed_url = response

    update_manuscript_audio_to_db(blob_name, signed_url, manuscript.id)

    logger.info(f"Successfully created news audio for user: {user_id}.")
    return signed_url
