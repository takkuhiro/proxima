import json
import logging
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from typing import Literal

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from googleapiclient.discovery import build

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# TODO: 環境変数にする
os.environ["GOOGLE_PROGRAMMABLE_SEARCH_API_KEY"] = "YOUR_ENV"
os.environ["GOOGLE_PROGRAMMABLE_SEARCH_CSE_ID"] = "YOUR_ENV"
os.environ["TOOL_API_SERVER_URL"] = "YOUR_ENV"

API_KEY = os.getenv("GOOGLE_PROGRAMMABLE_SEARCH_API_KEY")
CSE_ID = os.getenv("GOOGLE_PROGRAMMABLE_SEARCH_CSE_ID")
TOOL_API_SERVER_URL = os.getenv("TOOL_API_SERVER_URL")


def _scrape_page(url: str) -> str:
    """
    Webページをスクレイピングする関数
    """
    response = requests.get(url)
    html = response.content
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text()
    text = re.sub(r"\n+", "\n", text)
    return text


def google_search(query: str) -> str:
    """
    Google検索を行う関数

    :param query: 検索クエリ
    :return: 検索結果（Markdown形式）
    """
    service = build("customsearch", "v1", developerKey=API_KEY)
    res = service.cse().list(q=query, cx=CSE_ID, start=1, num=3, lr="lang_ja").execute()
    items = res["items"]
    urls = [item["link"] for item in items]
    titles = [item["title"] for item in items]
    with ThreadPoolExecutor(max_workers=len(items)) as executor:
        results = list(executor.map(_scrape_page, urls))
    contents = [f"# {title}\n{url}\n{text}\n" for title, url, text in zip(titles, urls, results, strict=False)]
    return "\n".join(contents)


def search_memory(user_id: str) -> str:
    """ユーザーに関して記憶していることをmemoryデータベースから取得して思い出す
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
    Returns:
        personal_information: ユーザーに関してエージェントが記憶している情報
    """
    logger.info("Fetching personal info from memory")
    body = {"function_name": "search_memory", "args": {"user_id": user_id}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    personal_infomation = response_json["data"]
    return personal_infomation


def add_memory(
    user_id: str,
    content: str,
    category: Literal["基本情報", "キャリア", "学習傾向", "興味のあるIT技術", "趣味", "エージェントの思考", "その他"],
) -> str:
    """ユーザーに関する情報を記録したり、ユーザーについて深く思考した内容を記録する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        content: 記憶する内容
        category: 記憶内容のカテゴリー
    Returns:
        result: 結果メッセージ
    """
    logger.info("Adding personal info into memory")
    body = {"function_name": "add_memory", "args": {"user_id": user_id, "content": content, "category": category}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def update_memory(user_id: str, id_: str, content: str) -> str:
    """メモリを更新する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        id_: 更新するメモリのID
        content: 更新する内容
    Returns:
        result: 結果メッセージ
    """
    logger.info("Updating personal info into memory")
    body = {"function_name": "update_memory", "args": {"user_id": user_id, "id": id_, "content": content}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def search_information(user_id: str) -> str:
    """毎日ユーザーの趣味思考にあった情報（ニュース）を収集しているので、それを取得する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
    Returns:
        information: ユーザーの趣味思考にあった情報
    """
    body = {"function_name": "search_information", "args": {"user_id": user_id}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    information = response_json["data"]
    return information


def search_tasks(user_id: str) -> str:
    """ユーザーのタスク（デイリークエスト）を取得する関数
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
    Returns:
        tasks: ユーザーのタスク（デイリークエスト）
    """
    logger.info(f"Fetching quests from information: {user_id}")
    body = {"function_name": "search_tasks", "args": {"user_id": user_id}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    tasks = response_json["data"]
    return tasks


def add_task(user_id: str, title: str, description: str, recommend: str, category: str, estimated_time: int) -> str:
    """ユーザーのタスク（デイリークエスト）を追加する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        title: タスクのタイトル
        description: タスクの説明
        recommend: タスクの推奨理由
        category: タスクのカテゴリー
        estimated_time: タスクの推定所要時間
    Returns:
        result: 結果メッセージ
    """
    body = {
        "function_name": "add_task",
        "args": {
            "user_id": user_id,
            "title": title,
            "description": description,
            "recommend": recommend,
            "category": category,
            "estimated_time": estimated_time,
        },
    }
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def update_task(
    user_id: str, id_: str, title: str, description: str, recommend: str, category: str, estimated_time: int, completed: bool
) -> str:
    """ユーザーのタスク（デイリークエスト）を更新する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        id_: 更新するタスクのID
        title: 更新するタスクのタイトル
        description: 更新するタスクの説明
        recommend: 更新するタスクの推奨理由
        category: 更新するタスクのカテゴリー
        estimated_time: 更新するタスクの推定所要時間
        completed: 更新するタスクの完了状況
    Returns:
        result: 結果メッセージ
    """
    body = {
        "function_name": "update_task",
        "args": {
            "user_id": user_id,
            "id": id_,
            "title": title,
            "description": description,
            "recommend": recommend,
            "category": category,
            "estimated_time": estimated_time,
            "completed": completed,
        },
    }
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def delete_task(user_id: str, id_: str) -> str:
    """
    ユーザーのタスク（デイリークエスト）を削除する
    """
    body = {"function_name": "delete_task", "args": {"user_id": user_id, "id": id_}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def search_career(user_id: str) -> str:
    """ユーザーのキャリア目標を取得する関数
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
    Returns:
        career: ユーザーのキャリア目標
    """
    body = {"function_name": "search_career", "args": {"user_id": user_id}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    career = response_json["data"]
    return career


def add_career(user_id: str, career_title: str, career_description: str, target_period: str) -> str:
    """ユーザーのキャリア目標を追加する関数
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        career_title: キャリア目標のタイトル
        career_description: キャリア目標の説明
        target_period: キャリア目標の対象期間
    Returns:
        result: 結果メッセージ
    """
    body = {
        "function_name": "add_career",
        "args": {
            "user_id": user_id,
            "career_title": career_title,
            "career_description": career_description,
            "target_period": target_period,
        },
    }
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def update_career(user_id: str, id_: str, career_title: str, career_description: str, target_period: str) -> str:
    """
    キャリア目標を更新する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        id_: 更新するキャリア目標のID
        career_title: 更新するキャリア目標のタイトル
        career_description: 更新するキャリア目標の説明
        target_period: 更新するキャリア目標の対象期間
    Returns:
        result: 結果メッセージ
    """
    body = {
        "function_name": "update_career",
        "args": {
            "user_id": user_id,
            "id": id_,
            "career_title": career_title,
            "career_description": career_description,
            "target_period": target_period,
        },
    }
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def delete_career(user_id: str, id_: str) -> str:
    """ユーザーのキャリア目標を削除する関数
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        id_: 削除するキャリア目標のID
    Returns:
        result: 結果メッセージ
    """
    body = {"function_name": "delete_career", "args": {"user_id": user_id, "id": id_}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def search_initiatives(user_id: str) -> str:
    """ユーザーのキャリアの実現に向かって中期的に定めているプランを取得する関数
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
    Returns:
        initiatives: ユーザーのキャリアの実現に向かって中期的に定めているプラン
    """
    body = {"function_name": "search_initiatives", "args": {"user_id": user_id}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    initiatives = response_json["data"]
    return initiatives


def add_initiative(user_id: str, title: str, body_text: str, target_period: str) -> str:
    """キャリアの実現に向かって中期的に定めているプランを追加する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        title: プランのタイトル
        body_text: プランの説明
        target_period: プランの対象期間
    Returns:
        result: 結果メッセージ
    """
    body = {
        "function_name": "add_initiative",
        "args": {"user_id": user_id, "title": title, "body": body_text, "target_period": target_period},
    }
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def update_initiative(user_id: str, id_: str, title: str, body_text: str, target_period: str) -> str:
    """キャリアの実現に向かって中期的に定めているプランを更新する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        id_: 更新するプランのID
        title: 更新するプランのタイトル
        body_text: 更新するプランの説明
        target_period: 更新するプランの対象期間
    Returns:
        result: 結果メッセージ
    """
    body = {
        "function_name": "update_initiative",
        "args": {"user_id": user_id, "id": id_, "title": title, "body": body_text, "target_period": target_period},
    }
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result


def delete_initiative(user_id: str, id_: str) -> str:
    """キャリアの実現に向かって中期的に定めているプランを削除する
    Args:
        user_id: <INFORMATION>タブ内で最初に与えられたユーザーID
        id_: 削除するプランのID
    Returns:
        result: 結果メッセージ
    """
    body = {"function_name": "delete_initiative", "args": {"user_id": user_id, "id": id_}}
    response = requests.post(
        f"{TOOL_API_SERVER_URL}/data",
        headers={"accept": "application/json", "content-type": "application/json"},
        data=json.dumps(body),
    )
    response_json = response.json()
    result = response_json["message"]
    return result
