import json
import logging
import os
import random
import time
from datetime import UTC, datetime, timedelta, timezone

import google.auth
import google.auth.transport.requests
import requests
import vertexai
from dotenv import load_dotenv
from google import genai
from google.cloud import bigquery, firestore
from google.cloud.firestore import CollectionReference, DocumentReference, DocumentSnapshot
from ulid import ulid
from vertexai import agent_engines

from constants.messages import (
    CREATE_QUEST_FAILED_MESSAGE,
    FIRST_GREET_MESSAGE_1,
    FIRST_GREET_MESSAGE_2,
    FIRST_GREET_MESSAGE_3,
    FIRST_GREET_MESSAGE_4,
    FIRST_GREET_MESSAGE_5,
)
from db import search_information, search_memory, search_tasks
from information_instruction import INFORMATION_INSTRUCTION

JST = timezone(timedelta(hours=+9), "JST")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

db = firestore.Client(database="proxima")
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

vertexai.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("AGENT_ENGINE_LOCATION"),
    staging_bucket=os.getenv("GOOGLE_CLOUD_STORAGE_BUCKETS"),
)

agent = agent_engines.get(os.getenv("ADK_AGENT_ENGINE_ID"))

credentials, project_id = google.auth.default()
credentials.refresh(google.auth.transport.requests.Request())
bq_client = bigquery.Client(project=project_id, credentials=credentials)


AGENT_NAME_MAP = {
    "career_agent": "Reika",
    "quest_agent": "Kaede",
    "proxima_agent": "Misaki",
}
GOOGLE_CLOUD_RUN_FUNCTIONS_URI = os.getenv("GOOGLE_CLOUD_RUN_FUNCTIONS_URI")

def _save_bq_chat(user_id: str, session_id: str, agent_session_id: str, content: str, content_type: str, meta: dict) -> None:
    """BigQueryにchatを保存する"""
    table_id = f"{project_id}.proxima.chat"
    id_ = ulid()
    meta_json = json.dumps(meta)

    # パラメータ化されたクエリを使用
    query = f"""
    INSERT INTO `{table_id}` (id, user_id, session_id, agent_session_id, content, content_type, meta, created_at)
    VALUES (?, ?, ?, ?, ?, ?, PARSE_JSON(?), CURRENT_TIMESTAMP())
    """

    # パラメータを配列として渡す
    params = [
        id_,
        user_id,
        session_id,
        agent_session_id,
        content,
        content_type,
        meta_json,
    ]

    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter(None, "STRING", param) for param in params]
    )

    bq_client.query(query, job_config=job_config).result()
    return


def _add_thinking_message(sessions_ref: CollectionReference, session_id: str, now_agent_name: str) -> DocumentReference:
    """考え中のstatusをFirestoreに保存する"""
    _, answer_ref = (
        sessions_ref.document(session_id)
        .collection("messages")
        .add(
            {
                "id": ulid(),
                "content": "",
                "loading": True,
                "role": "model",
                "status": "thinking",
                "agent": now_agent_name,
                "createdAt": firestore.SERVER_TIMESTAMP,
            }
        )
    )
    return answer_ref


def _send_middle_message(
    sessions_ref: CollectionReference,
    session_id: str,
    answer_ref: DocumentReference,
    middle_message: dict,
    now_agent_name: str,
    create_new_message: bool = True,
) -> DocumentReference:
    """
    途中のメッセージの場合、一度answer_refを更新してから、新しい考え中を表すメッセージを送信する
    functionCallの場合はfunctionResponseで上書きしたいのでcreate_new_message=Falseにする
    """
    answer_ref.update(middle_message)
    if create_new_message:
        _, answer_ref = (
            sessions_ref.document(session_id)
            .collection("messages")
            .add(
                {
                    "id": ulid(),
                    "content": "",
                    "loading": True,
                    "role": "model",
                    "status": "thinking",
                    "agent": now_agent_name,
                    "processing": True,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                }
            )
        )
    return answer_ref


def _create_agent_session(session_doc_ref: DocumentReference, user_id: str) -> str:
    """
    Agent Engine のセッションを作成する
    - Agent Engine のsession_idは、Agent Engineで発行される
    - そこで、session_idのマッピングをFirestoreで管理する
    """
    agent_session = agent.create_session(user_id=user_id)
    agent_session_id = agent_session["id"]
    session_doc_ref.set({"agentSessionId": agent_session_id, "updatedAt": firestore.SERVER_TIMESTAMP}, merge=True)
    logger.info(f"Issued Agent Session ID: {agent_session_id}")
    return agent_session_id


def _remember(sessions_ref: CollectionReference, session_id: str, user_id: str) -> tuple[str, str, str]:
    """
    DBからユーザーの過去の情報を取得する
    - Cloud SQL からユーザーのpreferencesを取得する
    - Firestore の過去のセッションから過去の会話履歴を取得する
    """
    logger.info(f"*** Remember elapsed time")
    start_time = time.time()
    # Cloud SQL からユーザーのpreferencesを取得する
    preferences = search_memory(user_id)
    search_memory_time = time.time()
    logger.info(f"*** Remember elapsed time: search_memory: {search_memory_time - start_time} seconds")

    selected_theme = random.choice(["events", "quests"])
    if selected_theme == "events":
        # Cloud SQL からユーザーのイベントを取得する
        theme_content = search_information(user_id)
    else:
        # Cloud SQL からユーザーのデイリークエストを取得する
        theme_content = search_tasks(user_id)
    search_tasks_time = time.time()
    logger.info(f"*** Remember elapsed time: search_tasks or information: {search_tasks_time - search_memory_time} seconds")

    # Firestore の過去のセッションから過去の会話履歴を取得する
    two_days_ago = datetime.now(UTC) - timedelta(days=2)

    # 一度にすべてのセッションとメッセージを取得
    sessions = sessions_ref.where("createdAt", ">=", two_days_ago).stream()
    past_chats = []

    for session in sessions:
        if session.id == session_id:
            continue

        # セッション内のすべてのメッセージを一度に取得
        messages = sessions_ref.document(session.id).collection("messages").order_by("createdAt").stream()

        conversations = []
        for msg in messages:
            msg_data = msg.to_dict()
            role = msg_data.get("role")
            content = msg_data.get("content")
            created_at = msg_data.get("createdAt")
            if created_at:
                created_at_str = created_at.strftime("%Y-%m-%d %H:%M")
                conversations.append(f"[{created_at_str}] {role}: {content}")

        if conversations:
            past_chats.append("\n------\n".join(conversations))

    past_chats_text = "\n".join(past_chats)

    past_chats_time = time.time()
    logger.info(f"*** Remember elapsed time: past_chats: {past_chats_time - search_tasks_time} seconds")

    logger.info(
        {"_remember": {"past_chats_text": past_chats_text, "preferences": preferences, "theme_content": theme_content}}
    )

    return preferences, past_chats_text, theme_content


async def chat(event_id: str, user_id: str, session_id: str, message_id: str) -> None:
    """チャットを実行する"""
    sessions_ref = db.collection("users", user_id, "sessions")

    session_doc_ref: DocumentReference = sessions_ref.document(session_id)
    session_doc: DocumentSnapshot = session_doc_ref.get()

    message_ref: DocumentReference = session_doc_ref.collection("messages").document(message_id)
    message: DocumentSnapshot = message_ref.get()
    content: str = message.get("content")
    now_agent_name: str = message.get("agent")

    logger.info(f"now_agent_name, content: {now_agent_name}, {content}")

    # 処理中かどうかのチェック
    if message.get("role") == "user":
        processing_flag = message.get("processing")
        if processing_flag:
            logger.info(f"Skip message from model: {message_id}")
            return
    message_ref.set({"processing": True}, merge=True)

    if message.get("role") == "model":
        # sessionFirstGreetがまだdoneに設定されていなければ/receive_greetを実行する
        if (
            message.get("content") == ""
            and message.get("status") == "thinking"
            and session_doc.get("sessionFirstGreet") == "yet"
        ):
            await receive_greet(event_id, user_id, session_id, message_ref, now_agent_name)
        else:
            logger.info(f"Skip message from model: {message_id}")
        return

    answer_ref = _add_thinking_message(sessions_ref, session_id, now_agent_name)

    agent_session_id: str | None = session_doc.get("agentSessionId")

    # 本来であれば/greetでセッションを作成しているはずだが、/greetが実行されなかった場合はここを通る
    if not agent_session_id:
        logger.warning(f"Agent Session ID not found: {user_id}, {session_id}")
        agent_session_id = _create_agent_session(session_doc_ref, user_id)
        preferences, past_chats_text, theme_content = _remember(sessions_ref, session_id, user_id)
        now = datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S")
        content = (
            INFORMATION_INSTRUCTION.replace("$DATETIME$", now)
            .replace("$PREFERENCES$", preferences)
            .replace("$PAST_CHATS_TEXT$", past_chats_text)
            .replace("$THEME_CONTENT$", theme_content)
            .replace("$USER_ID$", user_id)
            + content
        )
    _save_bq_chat(user_id, session_id, agent_session_id, content, "user", {})

    # Agent Engine へのリクエスト
    try:
        for event in agent.stream_query(
            user_id=user_id,
            session_id=agent_session_id,
            message=content,
        ):
            parts = event["content"]["parts"]
            logger.info(f"parts: {parts}")
            for part in parts:
                function_call: dict | None = part.get("function_call")
                function_response: dict | None = part.get("function_response")
                response: str | None = part.get("text")

                if response:
                    middle_message = {"content": response, "loading": False, "status": "success"}
                    # 通常の応答生成の場合はlen(parts) == 1, function callingの場合はlen(parts) == 3 となる
                    if len(parts) == 1:
                        answer_ref.update(middle_message)
                    else:
                        answer_ref = _send_middle_message(sessions_ref, session_id, answer_ref, middle_message, now_agent_name)
                    _save_bq_chat(user_id, session_id, agent_session_id, response, "response", {})
                if function_call:
                    middle_message = {"functionCall": function_call, "loading": False, "status": "success"}
                    if function_call.get("name") == "transfer_to_agent":
                        agent_name = function_call.get("args", {}).get("agent_name")
                        now_agent_name = AGENT_NAME_MAP[agent_name]
                    answer_ref = _send_middle_message(
                        sessions_ref, session_id, answer_ref, middle_message, now_agent_name, create_new_message=False
                    )
                    _save_bq_chat(user_id, session_id, agent_session_id, "", "function_call", function_call)
                if function_response:
                    middle_message = {"functionResponse": function_response, "loading": False, "status": "success"}
                    answer_ref = _send_middle_message(sessions_ref, session_id, answer_ref, middle_message, now_agent_name)
                    _save_bq_chat(user_id, session_id, agent_session_id, "", "function_response", function_response)
    except Exception as e:
        logger.error(f"Error in chat: {e}")

    logger.info(f"Processed chat: {event_id}, {user_id}, {session_id}, {message_id}, {response}")

    return


async def greet(event_id: str, user_id: str, session_id: str, message_ref: DocumentReference, now_agent_name: str) -> None:
    """Greet APIを実行する"""
    logger.info(f"Received '/greet' request: {event_id}, {user_id}, {session_id}")

    # セッションを設定
    sessions_ref = db.collection("users", user_id, "sessions")
    session_doc_ref: DocumentReference = sessions_ref.document(session_id)

    # 考え中のメッセージを更新する
    answer_ref = message_ref

    agent_session_id = _create_agent_session(session_doc_ref, user_id)

    # ユーザーの情報を取得
    preferences, past_chats_text, theme_content = _remember(sessions_ref, session_id, user_id)
    now = datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S")
    content = (
        INFORMATION_INSTRUCTION.replace("$DATETIME$", now)
        .replace("$PREFERENCES$", preferences)
        .replace("$PAST_CHATS_TEXT$", past_chats_text)
        .replace("$THEME_CONTENT$", theme_content)
        .replace("$USER_ID$", user_id)
    )
    logger.info(f"/greet: content: {content}")

    try:
        # Agent Engine へのリクエスト
        for event in agent.stream_query(
            user_id=user_id,
            session_id=agent_session_id,
            message=content,
        ):
            parts = event["content"]["parts"]
            # greet の場合は、text のみを返し、function_call は無視する
            if len(parts) > 0:
                response = parts[0].get("text")
                if response:
                    answer_ref.update({"content": response, "loading": False, "status": "success", "agent": now_agent_name})
                    _save_bq_chat(user_id, session_id, agent_session_id, response, "greet", {})
    except Exception as e:
        logger.error(f"Error in chat: {e}")

    _save_bq_chat(user_id, session_id, agent_session_id, content, "greet_input", {})
    logger.info(f"/greet: Processed greet: {event_id}, {user_id}, {session_id}")

    return


def get_session_count(user_id: str) -> int:
    """ユーザーのセッション数を取得する"""
    sessions_ref = db.collection("users", user_id, "sessions")
    return len(sessions_ref.get())


async def first_greet(
    event_id: str, user_id: str, session_id: str, message_ref: DocumentReference, now_agent_name: str
) -> None:
    """チュートリアル後の最初のGreet APIを実行する"""
    logger.info(f"Received '/first_greet' request: {event_id}, {user_id}, {session_id}")

    # ユーザーのstatusとfirstGreetを変更する
    doc_ref = db.document("users", user_id)
    doc_ref.update({"firstGreet": "doing", "status": "created"})

    sessions_ref = db.collection("users", user_id, "sessions")
    answer_ref = message_ref
    for i, message in enumerate([FIRST_GREET_MESSAGE_1, FIRST_GREET_MESSAGE_2, FIRST_GREET_MESSAGE_3]):
        answer_ref = _send_middle_message(
            sessions_ref, session_id, answer_ref, {"content": message, "loading": False, "status": "success"}, now_agent_name
        )
        if i < 2:
            time.sleep(random.randint(2, 5))

    session_doc_ref: DocumentReference = sessions_ref.document(session_id)
    _ = _create_agent_session(session_doc_ref, user_id)

    # タスク作成: Cloud Functionsのcreate_questsにリクエストする
    response = requests.post(
        f"{GOOGLE_CLOUD_RUN_FUNCTIONS_URI}/create-quest",
        json={"user_id": user_id},
        headers={"Content-Type": "application/json"},
    )
    if response.status_code == 200:
        answer_ref = _send_middle_message(
            sessions_ref,
            session_id,
            answer_ref,
            {"content": FIRST_GREET_MESSAGE_4, "loading": False, "status": "success"},
            now_agent_name,
        )
    else:
        logger.error(f"create-quest failed: {response.text}")
        answer_ref = _send_middle_message(
            sessions_ref,
            session_id,
            answer_ref,
            {"content": CREATE_QUEST_FAILED_MESSAGE, "loading": False, "status": "success"},
            now_agent_name,
        )

    # 終了メッセージ
    time.sleep(1)
    _ = _send_middle_message(
        sessions_ref,
        session_id,
        answer_ref,
        {"content": FIRST_GREET_MESSAGE_5, "loading": False, "status": "success"},
        now_agent_name,
        create_new_message=False,
    )

    # ニュースの作成: Cloud Functionsのcreate_newsにリクエストする
    response = requests.post(
        f"{GOOGLE_CLOUD_RUN_FUNCTIONS_URI}/crawl-events",
        json={"user_id": user_id},
        headers={"Content-Type": "application/json"},
    )
    logger.info(f"crawl-events response: {response.status_code} {response.text}")

    # アドバイスの生成: Cloud Functionsのadviceにリクエストする
    response = requests.post(
        f"{GOOGLE_CLOUD_RUN_FUNCTIONS_URI}/advice",
        json={"user_id": user_id},
        headers={"Content-Type": "application/json"},
    )
    logger.info(f"advice response: {response.status_code} {response.text}")

    doc_ref.update({"firstGreet": "done"})

    return


async def receive_greet(
    event_id: str, user_id: str, session_id: str, message_ref: DocumentReference, now_agent_name: str
) -> None:
    """Greet APIを実行する"""
    logger.info(f"Received '/receive_greet' request: {event_id}, {user_id}, {session_id}")

    # firestoreのfirstGreet次第で実行する関数を分ける
    doc_ref = db.document("users", user_id)
    doc_snapshot = doc_ref.get()
    first_greet_status = (doc_snapshot.to_dict() or {}).get("firstGreet")

    # firstGreetが存在しない場合は待つ
    if not first_greet_status:
        logger.warning(f"receive_greet: firstGreet not found: {user_id}")
        return

    if first_greet_status == "yet":
        await first_greet(event_id, user_id, session_id, message_ref, now_agent_name)
    else:
        await greet(event_id, user_id, session_id, message_ref, now_agent_name)

    # sessionFirstGreetを更新する
    session_doc_ref = db.collection("users", user_id, "sessions").document(session_id)
    session_doc_ref.set({"sessionFirstGreet": "done"}, merge=True)

    return
