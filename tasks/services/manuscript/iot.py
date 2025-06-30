import requests

from common.db import fetch_latest_manuscript_from_manuscripts
from common.firestore import db, get_all_user_ids


def get_user_iot_device_url(user_id: str) -> str | None:
    doc_ref = db.document("users", user_id)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict().get("iotDeviceUrl", "")
    return None


def send_request_iot(user_id: str | None = None) -> tuple[str, int]:
    """
    manuscriptsテーブルから最新のmanuscriptを取得し、Firestoreの/users/userIdからiotDeviceUrlを取得し、そのURLにngrok経由でIoTサーバーに送信する
    """
    if not user_id:
        user_ids = get_all_user_ids()
        for user_id in user_ids:
            send_request_iot(user_id)
        return ("OK", 200)
    iot_device_url = get_user_iot_device_url(user_id)
    if not iot_device_url:
        return ("iotDeviceUrl not found", 404)
    manuscript = fetch_latest_manuscript_from_manuscripts(user_id)
    if not manuscript:
        return ("manuscript not found", 404)
    data = {"id": manuscript.id, "audio_signed_url": manuscript.audio_signed_url}
    try:
        response = requests.post(f"{iot_device_url}/talk", json=data, timeout=300)
        response.raise_for_status()
    except Exception as e:
        return (f"Failed to send request: {e}", 500)
    return ("OK", 200)
