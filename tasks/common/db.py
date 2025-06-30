import logging
import os
import sys
from datetime import datetime
from typing import Any

import sqlalchemy
from dotenv import load_dotenv
from google.cloud.sql.connector import Connector, IPTypes
from sqlalchemy.engine.base import Connection

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.schemas import Advice, Event, Initiative, Manuscript, Memory, Quest, Routine

load_dotenv()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

PROJECT_ID = os.environ.get("PROJECT_ID")
DB_REGION = os.environ.get("DB_REGION")
DB_INSTANCE_NAME = os.environ.get("DB_INSTANCE_NAME")
INSTANCE_CONNECTION_NAME = f"{PROJECT_ID}:{DB_REGION}:{DB_INSTANCE_NAME}"

DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME")

# cf. https://cloud.google.com/blog/ja/topics/developers-practitioners/how-connect-cloud-sql-using-python-easy-way?hl=ja


def connect_tcp_socket() -> sqlalchemy.engine.base.Engine:
    """
    Cloud SQLの接続を確立する関数
    """

    def _getconn() -> Connection:
        with Connector() as connector:
            conn = connector.connect(
                INSTANCE_CONNECTION_NAME, "pg8000", user=DB_USER, password=DB_PASSWORD, db=DB_NAME, ip_type=IPTypes.PUBLIC
            )
        return conn

    pool = sqlalchemy.create_engine(
        "postgresql+pg8000://",
        creator=_getconn,
    )
    return pool


def execute_sql_with_params(sql: str, params: dict | list[dict]) -> tuple[list[Any], bool]:
    """
    SQLを実行する関数
    """
    pool = connect_tcp_socket()
    results = []
    try:
        if sql.strip().upper().startswith('SELECT'):
            with pool.connect() as conn:
                result = conn.execute(sqlalchemy.text(sql), parameters=params)
                results = result.fetchall()
        else:
            if isinstance(params, list):
                with pool.connect() as conn:
                    for param in params:
                        conn.execute(sqlalchemy.text(sql), parameters=param)
                    conn.commit()
            else:
                with pool.connect() as conn:
                    conn.execute(sqlalchemy.text(sql), parameters=params)
                    conn.commit()
    except Exception as e:
        logger.error(f"Error executing SQL: {e}")
        return [], False
    finally:
        pool.dispose()
    return list(results), True


def fetch_information_urls(user_id: str) -> list[str]:
    pool = connect_tcp_socket()
    try:
        with pool.connect() as conn:
            results = conn.execute(
                sqlalchemy.text("SELECT url FROM information WHERE user_id = :user_id"),
                {"user_id": user_id},
            ).fetchall()
    except Exception as e:
        logger.error(f"Error fetching information urls: {e}")
        return []
    finally:
        pool.dispose()
    return [result[0] for result in results]


def clean_text(text: str) -> str:
    """
    テキストからUTF-8として無効な文字 (NULLバイトを含む不正なUTF-8文字)を除去する
    """
    return "".join(char for char in text if ord(char) >= 32)


def save_event_to_information(events: list[Event]) -> str:
    logger.info(f"Saving events to information: {events}")
    # イベントデータをクリーニング
    events_dump = []
    for event in events:
        event_dict = event.model_dump()
        event_dict["title"] = clean_text(event_dict["title"])
        event_dict["body"] = clean_text(event_dict["body"])
        events_dump.append(event_dict)

    sql = """
    INSERT INTO information (id, user_id, url, category, title, body, recommend_level, recommend_sentence, favorite, created_at)
    VALUES (:id, :user_id, :url, :category, :title, :body, :recommend_level, :recommend_sentence, :favorite, :created_at)
    """
    _, success = execute_sql_with_params(sql, events_dump)
    if not success:
        return "Error: データの保存に失敗しました。"
    logger.info(f"Event saved to information: {events}")
    return "OK"


def search_memory(user_id: str) -> str:
    """
    メモリからユーザーの個人情報を取得する
    """
    logger.info("Fetching personal info from memory")

    sql = """
    SELECT content, updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS updated_at
    FROM memory
    WHERE category = 'personal_info'
    AND user_id = :user_id
    ORDER BY created_at DESC
    LIMIT 100
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "Error: データの取得に失敗しました。"

    contents = []
    for result in results:
        if result:
            content, updated_at = result
            try:
                date_str = updated_at.strftime("%Y年%m月%d日")
            except Exception:
                date_str = str(updated_at)
            contents.append(f"[{date_str}] {content}")

    personal_info = "\n".join(contents)
    logger.info(f"Got personal info: {personal_info[:30]}")

    return personal_info


def save_quests_to_information(quests: list[Quest]) -> str:
    logger.info(f"Saving quests to information: {quests}")
    quests_dump = [quest.model_dump() for quest in quests]

    sql = """
    INSERT INTO tasks (
        id,
        user_id,
        category,
        title,
        description,
        recommend,
        estimated_time,
        completed,
        created_at
    )
    VALUES (
        :id,
        :user_id,
        :category,
        :title,
        :description,
        :recommend,
        :estimated_time,
        :completed,
        :created_at
    )
    """
    _, success = execute_sql_with_params(sql, quests_dump)
    if not success:
        return "Error: データの保存に失敗しました。"
    logger.info(f"Quests saved to information: {quests}")
    return "OK"


def fetch_quests_from_information(user_id: str) -> str:
    logger.info(f"Fetching quests from information: {user_id}")

    sql = """
    SELECT id, user_id, category, title, description, recommend, estimated_time, completed, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at
    FROM tasks
    WHERE user_id = :user_id
    ORDER BY created_at DESC
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "Error: データの取得に失敗しました。"

    contents = []
    for result in results:
        if result:
            _, _, _, title, description, recommend, _, completed, created_at = result
            try:
                date_str = created_at.strftime("%Y年%m月%d日")
            except Exception:
                date_str = str(created_at)
            completed_text = "完了" if completed else "未完了"
            content = (
                f"# [{date_str}] {title}\n"
                f"### タスク概要: {description}\n"
                f"### 推奨理由: {recommend}\n"
                f"### 完了状況: {completed_text}\n"
            )
            contents.append(content)

    quests_str = "\n".join(contents)
    logger.info(f"Got quests: {quests_str}")

    return quests_str


def fetch_top3_today_information(user_id: str) -> list[dict]:
    """
    今日の日付でrecommend_levelが高い順に3件取得
    """
    sql = """
    SELECT id, title, body, url, recommend_level, category, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at
    FROM information
    WHERE (
        (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date
        >= CURRENT_DATE - INTERVAL '1 days'
    ) AND user_id = :user_id
    ORDER BY recommend_level DESC
    LIMIT 3
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return []
    info_list = []
    for row in results:
        info_list.append(
            {
                "id": row[0],
                "title": row[1],
                "body": row[2],
                "url": row[3],
                "recommend_level": row[4],
                "category": row[5],
                "created_at": row[6],
            }
        )
    return info_list


def fetch_today_tasks(user_id: str) -> list[dict]:
    """
    今日の日付のtasksを取得
    """
    sql = """
    SELECT id, title, description, recommend, estimated_time, completed, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at
    FROM tasks
    WHERE (
        (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date
        >= CURRENT_DATE - INTERVAL '1 days'
    ) AND user_id = :user_id
    ORDER BY created_at DESC
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return []
    task_list = []
    for row in results:
        task_list.append(
            {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "recommend": row[3],
                "estimated_time": row[4],
                "completed": row[5],
                "created_at": row[6],
            }
        )
    return task_list


def save_manuscript_to_manuscripts(manuscript: Manuscript) -> str:
    logger.info(f"Saving manuscript to manuscripts: {manuscript}")
    sql = """
    INSERT INTO manuscripts (
        id,
        user_id,
        character_id,
        manuscript,
        ref_info_ids,
        ref_tasks_ids,
        created_at,
        updated_at,
        audio_gcs_path,
        audio_signed_url
    )
    VALUES (
        :id,
        :user_id,
        :character_id,
        :manuscript,
        :ref_info_ids,
        :ref_tasks_ids,
        :created_at,
        :updated_at,
        :audio_gcs_path,
        :audio_signed_url
    ) RETURNING id
    """
    _, success = execute_sql_with_params(sql, manuscript.model_dump())
    if not success:
        return "Error: データの保存に失敗しました。"
    logger.info(f"manuscript saved to manuscripts: {manuscript}")
    return "OK"


def fetch_latest_manuscript_from_manuscripts(user_id: str) -> Manuscript | None:
    """
    manuscriptsテーブルから最新のmanuscriptを取得
    """
    sql = """
    SELECT id, user_id, character_id, manuscript, ref_info_ids, ref_tasks_ids, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at, updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS updated_at, audio_gcs_path, audio_signed_url FROM manuscripts
    WHERE user_id = :user_id
    ORDER BY created_at DESC
    LIMIT 1
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return None
    if not results:
        return None
    result = results[0]
    if result:
        return Manuscript(
            id=result[0],
            user_id=result[1],
            character_id=result[2],
            manuscript=result[3],
            ref_info_ids=result[4],
            ref_tasks_ids=result[5],
            created_at=result[6],
            updated_at=result[7],
            audio_gcs_path=result[8],
            audio_signed_url=result[9],
        )
    return None


def update_manuscript_audio_to_db(audio_gcs_path: str, audio_signed_url: str, manuscript_id: str) -> str:
    logger.info(f"Updating manuscript audio to db: {audio_gcs_path}, {audio_signed_url}, {manuscript_id}")
    sql = """
    UPDATE manuscripts
    SET audio_gcs_path = :audio_gcs_path,
    audio_signed_url = :audio_signed_url,
    updated_at = :updated_at
    WHERE id = :id
    """
    _, success = execute_sql_with_params(sql, {"audio_gcs_path": audio_gcs_path, "audio_signed_url": audio_signed_url, "id": manuscript_id, "updated_at": datetime.now()})
    if not success:
        return "Error: データの更新に失敗しました。"
    logger.info(f"Manuscript audio updated to db: {audio_gcs_path}, {audio_signed_url}, {manuscript_id}")
    return "OK"


def save_initiatives_to_db(initiatives: list[Initiative]) -> str:
    logger.info(f"Saving initiatives to db: {initiatives}")
    initiatives_dump = [initiative.model_dump() for initiative in initiatives]

    sql = """
    INSERT INTO initiatives (
        id,
        user_id,
        title,
        body,
        target_period,
        created_at,
        deleted
    )
    VALUES (
        :id,
        :user_id,
        :title,
        :body,
        :target_period,
        :created_at,
        :deleted
    )
    """
    _, success = execute_sql_with_params(sql, initiatives_dump)
    if not success:
        return "Error: データの保存に失敗しました。"
    logger.info(f"Initiatives saved to db: {initiatives}")
    return "OK"


def fetch_initiatives_from_db(user_id: str) -> str:
    sql = """
    SELECT * FROM initiatives WHERE user_id = :user_id AND deleted = false
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "エラーが発生しました"

    contents = []
    for result in results:
        _, _, title, body, target_period, _, _ = result
        content = f"# {title}\n### 中期目標の詳細\n{body}\n### 達成期限\n{target_period}\n"
        contents.append(content)
    return "\n---\n".join(contents)


def save_memory_to_db(memories: list[Memory]) -> str:
    pool = connect_tcp_socket()
    memories_dump = [memory.model_dump() for memory in memories]
    sql = """
    INSERT INTO memory (id, user_id, category, content, created_at, updated_at)
    VALUES (:id, :user_id, :category, :content, :created_at, :updated_at)
    """
    _, success = execute_sql_with_params(sql, memories_dump)
    if not success:
        return "Error: データの保存に失敗しました。"
    logger.info(f"Memories saved: {memories}")
    return "OK"


def fetch_tasks_from_db(user_id: str) -> str:
    sql = """
    SELECT title, description, completed, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at FROM tasks
    WHERE user_id = :user_id
    ORDER BY created_at DESC
    LIMIT 10
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "エラーが発生しました"
    return "\n---\n".join(
        [f"# {task[0]}\n### タスク概要: {task[1]}\n### 完了状況: {task[2]}\n### 作成日時: {task[3]}" for task in results]
    )


def fetch_career_goals_from_db(user_id: str) -> str:
    sql = """
    SELECT career_title, career_body, target_period FROM career_goals
    WHERE user_id = :user_id
    ORDER BY created_at DESC
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "エラーが発生しました"
    return "\n---\n".join([f"# キャリア: {goal[0]}\n### 詳細\n{goal[1]}\n### 達成期限: {goal[2]}" for goal in results])


def save_advice_to_db(advice: Advice) -> bool:
    sql = """
    INSERT INTO advices (id, user_id, markdown, created_at, deleted)
    VALUES (:id, :user_id, :markdown, :created_at, :deleted)
    """
    _, success = execute_sql_with_params(sql, advice.model_dump())
    if not success:
        return False
    logger.info(f"Advice saved to db: {advice}")
    return True


def fetch_yesterdays_routines_from_db(user_id: str) -> list[Routine]:
    sql = """
    SELECT * FROM routines
    WHERE user_id = :user_id
    AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date >= CURRENT_DATE - INTERVAL '1 day'
    AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date < CURRENT_DATE
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return []
    return [Routine(**routine) for routine in results]


def save_routines_to_db(routines: list[Routine]) -> str:
    logger.info(f"Saving routines to db: {routines}")
    routines_dump = [routine.model_dump() for routine in routines]
    sql = """
    INSERT INTO routines (
        id,
        user_id,
        title,
        description,
        frequency,
        time,
        streak,
        category,
        completed,
        created_at,
        deleted
    )
    VALUES (
        :id,
        :user_id,
        :title,
        :description,
        :frequency, :time, :streak, :category, :completed, :created_at, :deleted)
    )
    """
    _, success = execute_sql_with_params(sql, routines_dump)
    if not success:
        return "Error: データの保存に失敗しました。"
    logger.info(f"Routines saved to db: {routines}")
    return "OK"
