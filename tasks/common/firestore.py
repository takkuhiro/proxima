from google.cloud import firestore  # type: ignore

db = firestore.Client(database="proxima")


def get_all_user_ids() -> list[str]:
    users = db.collection("users").get()
    return [user.id for user in users]


def get_sessions_for_user(user_id: str) -> list[dict]:
    """
    指定ユーザーの全セッションを取得（createdAt降順）
    """
    sessions_ref = db.collection("users").document(user_id).collection("sessions")
    sessions = sessions_ref.order_by("createdAt", direction=firestore.Query.DESCENDING).get()
    return [session.to_dict() | {"id": session.id} for session in sessions]


def set_session_summary_flag(user_id: str, session_id: str) -> None:
    session_ref = db.collection("users").document(user_id).collection("sessions").document(session_id)
    session_ref.update({"summary": True})
