import logging
import os
from datetime import UTC, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from google import genai
from ulid import ulid

from common.db import save_memory_to_db, search_memory
from common.firestore import db, get_all_user_ids, get_sessions_for_user, set_session_summary_flag
from common.schemas import ExtractMemory, Memory

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

SUMMARIZE_MEMORY_INSTRUCTION = """\
ユーザーの会話メッセージ一覧の中から、今後のユーザー体験向上やパーソナライズに役立つ重要な情報・記憶すべき内容があるか判定して、あれば要約してください。
ただし、すでにデータベースに保存してある情報は除外する必要があります。


# すでにデータベースに保存してある情報
<MEMORIES>
$MEMORIES$
</MEMORIES>


# 対象の会話メッセージ一覧
<MESSAGES>
$MESSAGES$
</MESSAGES>


# 出力条件
- 事実を優先的に抽出
- 日本語で出力
"""


def _summarize_messages(messages: str, memories: str) -> ExtractMemory:
    instruction = SUMMARIZE_MEMORY_INSTRUCTION.replace("$MESSAGES$", messages).replace("$MEMORIES$", memories)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=instruction,
        config={
            "response_mime_type": "application/json",
            "response_schema": ExtractMemory,
        },
    )
    parsed: Any = response.parsed
    if not isinstance(parsed, ExtractMemory):
        raise ValueError("Invalid response from Gemini")
    extract_memory: ExtractMemory = parsed
    return extract_memory


def _get_messages_for_session(user_id: str, session_id: str) -> list[str]:
    messages_ref = db.collection("users").document(user_id).collection("sessions").document(session_id).collection("messages")
    messages = messages_ref.order_by("createdAt").get()
    return [m.to_dict().get("content", "") for m in messages if m.to_dict().get("content")]


def save_old_memory(user_id: str | None = None) -> tuple[str, int]:
    """
    3日以上前の全セッションのメッセージをまとめて要約し、memoryテーブルに1件保存
    Firestoreのsessionドキュメントに{'summary': True}を書き込む
    """
    if user_id is None:
        user_ids = get_all_user_ids()
        for user_id in user_ids:
            save_old_memory(user_id)
        return ("OK", 200)

    sessions = get_sessions_for_user(user_id)
    memories = search_memory(user_id)
    three_days_ago = datetime.now(UTC) - timedelta(days=3)
    old_sessions = [s for s in sessions if "createdAt" in s and s["createdAt"] < three_days_ago and not s.get("summary")]
    logger.info(f"Found {len(old_sessions)} old sessions")
    if not old_sessions:
        return ("No old sessions found", 200)

    # すべてのold_sessionのmessagesをまとめて取得
    all_messages = []
    session_ids = []
    for session in old_sessions:
        session_id = session["id"]
        session_ids.append(session_id)
        messages = _get_messages_for_session(user_id, session_id)
        all_messages.extend(messages)
    if not all_messages:
        return ("No messages to summarize", 200)
    msg_text = "\n".join(all_messages)
    if not msg_text.strip():
        return ("No messages to summarize", 200)
    extract_memory = _summarize_messages(msg_text, memories)
    if not extract_memory.necessary:
        return ("No necessary information found", 200)

    memories_to_save = []
    for summary in extract_memory.contents:
        memory = Memory(
            id=ulid(),
            user_id=user_id,
            category="エージェントの思考",
            content=summary,
            created_at=datetime.now(ZoneInfo("Asia/Tokyo")),
            updated_at=datetime.now(ZoneInfo("Asia/Tokyo")),
        )
        memories_to_save.append(memory)

    if memories_to_save:
        result = save_memory_to_db(memories_to_save)
        if result != "OK":
            logger.error(f"Error saving memory: {result}")
        else:
            # すべてのold_sessionにsummary: Trueを付与
            for session_id in session_ids:
                try:
                    set_session_summary_flag(user_id, session_id)
                except Exception as e:
                    logger.error(f"Error updating session summary flag: {e}")
    return ("OK", 200)
