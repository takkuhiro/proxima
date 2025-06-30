import logging
import os
import sys
from datetime import datetime
from typing import Any, Literal

import sqlalchemy
from dotenv import load_dotenv
from google.cloud.sql.connector import Connector, IPTypes
from sqlalchemy.engine.base import Connection
from ulid import ulid

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# cf. https://cloud.google.com/blog/ja/topics/developers-practitioners/how-connect-cloud-sql-using-python-easy-way?hl=ja

PROJECT_ID = os.getenv("PROJECT_ID")
DB_REGION = os.getenv("DB_REGION")
DB_INSTANCE_NAME = os.getenv("DB_INSTANCE_NAME")
INSTANCE_CONNECTION_NAME = f"{PROJECT_ID}:{DB_REGION}:{DB_INSTANCE_NAME}"
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")


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


# ---
# memory
# ---
def search_memory(user_id: str) -> str:
    """
    メモリからユーザーの個人情報を最大100件取得する
    """
    sql = """
    SELECT id, category, content, updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS updated_at
    FROM memory
    WHERE user_id = :user_id
    ORDER BY created_at DESC
    LIMIT 100
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "Error: データの取得に失敗しました。"

    # 最大で100件まで取得する
    latest_results = results[:100]

    contents = []
    for result in latest_results:
        if result:
            id_, category, content, updated_at = result
            try:
                date_str = updated_at.strftime("%Y年%m月%d日")
            except Exception:
                date_str = str(updated_at)
            content = f"# ID: {id_}\n## カテゴリ: {category}\n## 内容: {content}\n## 更新日時: {date_str}\n"
            contents.append(content)

    personal_infomation = "\n---\n".join(contents)
    logger.info(f"Got personal info.")

    return personal_infomation


def add_memory(
    user_id: str,
    content: str,
    category: Literal["基本情報", "キャリア", "学習傾向", "興味のあるIT技術", "趣味", "エージェントの思考", "その他"],
) -> str:
    """
    メモリを追加する
    ユーザーに関する情報を記録したり、ユーザーについて深く思考した内容を記録する
    """
    sql = """
    INSERT INTO memory (id, user_id, category, content, created_at, updated_at)
    VALUES (:id, :user_id, :category, :content, :created_at, :updated_at)
    """
    id_ = ulid()
    _, success = execute_sql_with_params(
        sql,
        {
            "id": id_,
            "user_id": user_id,
            "category": category,
            "content": content,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
    )
    if not success:
        return f"メモリの追加に失敗しました。( id: {id_} )"
    return f"メモリを追加しました ( id: {id_} )"


def update_memory(
    user_id: str,
    id_: str,
    content: str,
) -> str:
    sql = """
    UPDATE memory SET content = :content, updated_at = :updated_at WHERE id = :id AND user_id = :user_id
    """
    _, success = execute_sql_with_params(
        sql,
        {
            "id": id_,
            "user_id": user_id,
            "content": content,
            "updated_at": datetime.now(),
        },
    )
    if not success:
        return f"メモリの更新に失敗しました ( id: {id_} )"
    return f"メモリを更新しました (id: {id_} )"


# ---
# information
# ---
def search_information(user_id: str) -> str:
    """
    informationテーブルからcreated_atが今日のものを取得する
    """
    sql = """
    SELECT
        id,
        title,
        body,
        url,
        recommend_level,
        category,
        created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at
    FROM information
    WHERE (
        (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date
        >= CURRENT_DATE - INTERVAL '1 days'
    ) AND user_id = :user_id
    ORDER BY recommend_level DESC
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "Error: データの取得に失敗しました。"

    events = []
    for result in results:
        if result:
            title, body, url, recommend_level, category, created_at = result
            cropped_body = f"{body[:1000]}..." if len(body) > 1000 else body
            event_line = (
                f"# {title}\n"
                f"- URL: {url}\n"
                f"- 推奨度(1~5): {recommend_level}\n"
                f"- カテゴリ: {category}\n"
                f"- 記事取得日: {created_at}\n"
                f"- 本文: {cropped_body}\n"
            )
            events.append(event_line)

    title_line = "# 今日のおすすめイベント"

    return title_line + "\n---\n".join(events)


# ---
# tasks
# ---
def search_tasks(user_id: str) -> str:
    """
    tasksテーブルからユーザーの今日の分のデイリークエストを取得する
    """
    sql = """
    SELECT title, description, recommend, estimated_time, completed FROM tasks
    WHERE (
        user_id = :user_id
        AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date
        >= CURRENT_DATE - INTERVAL '1 day'
    )
    ORDER BY created_at DESC
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "データの取得に失敗しました"

    daily_quests = []
    for result in results:
        title, description, recommend, estimated_time, completed = result
        daily_quest_line = (
            f"# {title}\n"
            f"- 説明: {description}\n"
            f"- 推奨度(1~5): {recommend}\n"
            f"- 予想所要時間: {estimated_time}\n"
            f"- 完了ステータス: {completed} (もし未完了であればユーザーに促してください)\n"
        )
        daily_quests.append(daily_quest_line)

    title_line = "# 今日のデイリークエスト"

    return title_line + "\n---\n".join(daily_quests)


def add_task(user_id: str, title: str, description: str, recommend: str, category: str, estimated_time: int) -> str:
    """
    ユーザーのタスク（デイリークエスト）を追加する
    """
    sql = """
    INSERT INTO tasks (
        id,
        user_id,
        title,
        description,
        recommend,
        category,
        estimated_time,
        completed,
        created_at,
    ) VALUES (
        :id,
        :user_id,
        :title,
        :description,
        :recommend,
        :category,
        :estimated_time,
        :completed,
        :created_at,
    )
    """
    id_ = ulid()
    _, success = execute_sql_with_params(
        sql,
        {
            "id": id_,
            "user_id": user_id,
            "title": title,
            "description": description,
            "recommend": recommend,
            "category": category,
            "estimated_time": estimated_time,
            "completed": False,
            "created_at": datetime.now(),
        },
    )
    if not success:
        return f"タスクの追加に失敗しました ( id: {id_} )"
    return f"タスクを追加しました ( id: {id_} )"


def update_task(
    user_id: str, id_: str, title: str, description: str, recommend: str, category: str, estimated_time: int, completed: bool
) -> str:
    """
    ユーザーのタスク（デイリークエスト）を更新する
    """
    sql = """
    UPDATE tasks
    SET
        title = :title,
        description = :description,
        recommend = :recommend,
        category = :category,
        estimated_time = :estimated_time,
        completed = :completed,
    WHERE id = :id AND user_id = :user_id
    """
    _, success = execute_sql_with_params(
        sql,
        {
            "id": id_,
            "user_id": user_id,
            "title": title,
            "description": description,
            "recommend": recommend,
            "category": category,
            "estimated_time": estimated_time,
            "completed": completed,
        },
    )
    if not success:
        return f"タスクの更新に失敗しました ( id: {id_} )"
    return f"タスクを更新しました ( id: {id_} )"


def delete_task(user_id: str, id_: str) -> str:
    """
    ユーザーのタスク（デイリークエスト）を削除する
    """
    sql = """
    DELETE FROM tasks WHERE id = :id AND user_id = :user_id
    """
    _, success = execute_sql_with_params(sql, {"id": id_, "user_id": user_id})
    if not success:
        return f"タスクの削除に失敗しました ( id: {id_} )"
    return f"タスクを削除しました ( id: {id_} )"


# ---
# career
# ---
def search_career(user_id: str) -> str:
    """
    ユーザーのキャリア目標を取得する
    """
    sql = """
    SELECT
        id,
        user_id,
        career_title,
        career_description,
        target_period,
        created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at,
        updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS updated_at
    FROM career_goals
    WHERE user_id = :user_id AND deleted = false
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "Error: データの取得に失敗した"

    contents = []
    for result in results:
        if result:
            id_, _, career_title, career_description, target_period, created_at, updated_at = result
            try:
                date_str = created_at.strftime("%Y年%m月%d日")
                updated_date_str = updated_at.strftime("%Y年%m月%d日")
            except Exception:
                date_str = str(created_at)
                updated_date_str = str(updated_at)
            content = (
                f"# ID: {id_}\n"
                f"## キャリアタイトル: {career_title}\n"
                f"## キャリア目標: {career_description}\n"
                f"## 対象期間: {target_period}\n"
                f"## 作成日時: {date_str}\n"
                f"## 更新日時: {updated_date_str}\n"
            )
            contents.append(content)

    return "\n---\n".join(contents)


def add_career(user_id: str, career_title: str, career_description: str, target_period: str) -> str:
    """
    キャリア目標を追加する
    """
    sql = """
    INSERT INTO career_goals (
        id,
        user_id,
        career_title,
        career_description,
        target_period,
        created_at,
    ) VALUES (
        :id,
        :user_id,
        :career_title,
        :career_description,
        :target_period,
        :created_at,
    )
    """
    id_ = ulid()
    _, success = execute_sql_with_params(
        sql,
        {
            "id": id_,
            "user_id": user_id,
            "career_title": career_title,
            "career_description": career_description,
            "target_period": target_period,
            "created_at": datetime.now(),
        },
    )
    if not success:
        return f"キャリア目標の追加に失敗しました ( id: {id_} )"
    return f"キャリア目標を追加しました ( id: {id_} )"


def update_career(user_id: str, id_: str, career_title: str, career_description: str, target_period: str) -> str:
    """
    キャリア目標を更新する
    """
    sql = """
    UPDATE career_goals
    SET
        career_title = :career_title,
        career_description = :career_description,
        target_period = :target_period,
    WHERE id = :id AND user_id = :user_id
    """
    _, success = execute_sql_with_params(
        sql,
        {
            "id": id_,
            "user_id": user_id,
            "career_title": career_title,
            "career_description": career_description,
            "target_period": target_period,
        },
    )
    if not success:
        return f"キャリア目標の更新に失敗しました (id: {id_})"
    return f"キャリア目標を更新しました ( id: {id_} )"


def delete_career(user_id: str, id_: str) -> str:
    """
    キャリア目標を削除する
    """
    sql = """
    UPDATE career_goals SET deleted = true WHERE id = :id AND user_id = :user_id
    """
    _, success = execute_sql_with_params(sql, {"id": id_, "user_id": user_id})
    if not success:
        return f"キャリア目標の削除に失敗しました ( id: {id_})"
    return f"キャリア目標を削除しました ( id: {id_} )"


# ---
# initiatives
# ---
def search_initiatives(user_id: str) -> str:
    """
    キャリアの実現に向かって中期的に定めているプラン（=initiative）を取得する
    """
    sql = """
    SELECT
        id,
        user_id,
        title,
        body,
        target_period,
        created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at
    FROM initiatives
    WHERE user_id = :user_id AND deleted = false
    """
    results, success = execute_sql_with_params(sql, {"user_id": user_id})
    if not success:
        return "Error: データの取得に失敗した"

    contents = []
    for result in results:
        if result:
            id_, _, title, body, target_period, created_at = result
            try:
                date_str = created_at.strftime("%Y年%m月%d日")
            except Exception:
                date_str = str(created_at)
            content = (
                f"# ID: {id_}\n"
                f"## プランタイトル: {title}\n"
                f"## プラン詳細: {body}\n"
                f"## 対象期間: {target_period}\n"
                f"## 作成日時: {date_str}\n"
            )
            contents.append(content)

    return "\n---\n".join(contents)


def add_initiative(user_id: str, title: str, body: str, target_period: str) -> str:
    """
    キャリアの実現に向かって中期的に定めているプラン（=initiative）を追加する
    """
    sql = """
    INSERT INTO initiatives (
        id,
        user_id,
        title,
        body,
        target_period,
        created_at,
    ) VALUES (
        :id,
        :user_id,
        :title,
        :body,
        :target_period,
        :created_at,
    )
    """
    id_ = ulid()
    _, success = execute_sql_with_params(
        sql,
        {
            "id": id_,
            "user_id": user_id,
            "title": title,
            "body": body,
            "target_period": target_period,
            "created_at": datetime.now(),
        },
    )
    if not success:
        return f"プランの追加に失敗しました ( id: {id_} )"
    return f"プランを追加しました ( id: {id_} )"


def update_initiative(user_id: str, id_: str, title: str, body: str, target_period: str) -> str:
    """
    キャリアの実現に向かって中期的に定めているプラン（=initiative）を更新する
    """
    sql = """
    UPDATE initiatives
    SET
        title = :title,
        body = :body,
        target_period = :target_period,
    WHERE id = :id AND user_id = :user_id
    """
    _, success = execute_sql_with_params(
        sql, {"id": id_, "user_id": user_id, "title": title, "body": body, "target_period": target_period}
    )
    if not success:
        return f"プランの更新に失敗しました (id: {id_})"
    return f"プランを更新しました ( id: {id_} )"


def delete_initiative(user_id: str, id_: str) -> str:
    """
    キャリアの実現に向かって中期的に定めているプラン（=initiative）を削除する
    """
    sql = """
    UPDATE initiatives SET deleted = true WHERE id = :id AND user_id = :user_id
    """
    _, success = execute_sql_with_params(sql, {"id": id_, "user_id": user_id})
    if not success:
        return f"プランの削除に失敗しました (id: {id_})"
    return f"プランを削除しました ( id: {id_} )"
