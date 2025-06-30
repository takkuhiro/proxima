import logging
import os
from datetime import datetime
from typing import Any, Literal
from zoneinfo import ZoneInfo

import requests
from google import genai
from ulid import ulid

from common.db import (
    fetch_information_urls,
    save_event_to_information,
    search_memory,
)
from common.firestore import get_all_user_ids
from common.schemas import ConnpassSearchResult, Event, GoogleSearchResult, RecommendResult
from common.tools import google_search
from services.crawl_events.instruction import GENERATE_QUERIES_INSTRUCTION, RECOMMEND_INSTRUCTION

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


def _generate_queries(user_preferences: str, category: str) -> list[str]:
    instruction = GENERATE_QUERIES_INSTRUCTION.replace("$CATEGORY$", category).replace("$USER_PREFERENCES$", user_preferences)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=instruction,
        config={
            "response_mime_type": "application/json",
            "response_schema": list[str],
        },
    )
    parsed: Any = response.parsed
    if not isinstance(parsed, list):
        raise ValueError("Invalid response from Gemini")
    queries: list[str] = parsed

    logger.info(f"queries: {queries}")

    return queries


def _generate_recommend_results(
    user_preferences: str,
    id2page: dict[str, GoogleSearchResult] | dict[str, ConnpassSearchResult],
    fix_event_category: bool = False,
) -> dict[str, RecommendResult]:
    """
    LLMを用いてレコメンド結果を生成する
    """
    # 文字数制限をつける. max=1048575
    pages = []
    for id, page in id2page.items():
        title = page.title[:1000]
        url = page.url[:1000]
        body = page.body[:10000]
        pages.append(f"# ID: {id}\n### タイトル: {title}\n### URL: {url}\n### 本文:\n{body}\n")
    body = "\n---\n".join(pages)

    instruction = RECOMMEND_INSTRUCTION.replace("$USER_PREFERENCES$", user_preferences).replace("$BODY$", body)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=instruction,
        config={
            "response_mime_type": "application/json",
            "response_schema": list[RecommendResult],
        },
    )
    parsed: Any = response.parsed
    if not isinstance(parsed, list):
        raise ValueError("Invalid response from Gemini")
    recommend_results: list[RecommendResult] = parsed
    recommend_mapping: dict[str, RecommendResult] = {}
    for id_ in id2page.keys():
        found = False
        for result in recommend_results:
            if fix_event_category:
                result.category = "イベント"
            if result.id == id_:
                recommend_mapping[id_] = result
                found = True
                break
        if not found:
            category: Literal["IT", "イベント", "趣味", "スポット", "その他"] = "イベント" if fix_event_category else "その他"
            recommend_mapping[id_] = RecommendResult(id=id_, category=category, recommend_level=3, recommend_sentence="")
    return recommend_mapping


def _gather_events(
    id2page: dict[str, GoogleSearchResult] | dict[str, ConnpassSearchResult],
    recommend_mapping: dict[str, RecommendResult],
    user_id: str,
) -> list[Event]:
    events = []
    for id_, page in id2page.items():
        event = Event(
            id=ulid(),
            user_id=user_id,
            url=page.url,
            category=recommend_mapping[id_].category,
            title=page.title,
            body=page.body,
            recommend_level=recommend_mapping[id_].recommend_level,
            recommend_sentence=recommend_mapping[id_].recommend_sentence,
            favorite=False,
            created_at=datetime.now(ZoneInfo("Asia/Tokyo")),
        )
        events.append(event)
    return events


def _search_connpass(queries: list[str], exist_urls: list[str]) -> dict[str, ConnpassSearchResult]:
    id2connpass: dict[str, ConnpassSearchResult] = {}
    cnt = 1

    for query in queries:
        url = f"https://connpass.com/api/v2/events/?keyword={query}"
        try:
            response = requests.get(url, headers={"X-API-Key": os.getenv("CONNPASS_API_KEY"), "User-Agent": "Mozilla/5.0"})
            body = response.json()
        except Exception as e:
            logger.error(f"error: {e}")
            continue

        events = body.get("events", [])
        logger.info(f"events: {events}")

        for event in events:
            url = event.get("url")
            title = event.get("title") or ""
            description = event.get("description") or ""
            start_time = event.get("started_at") or ""
            place = event.get("place") or ""
            body = f"{description} | 開始時刻: {start_time} | 開催場所: {place}"

            if url in exist_urls:
                continue

            logger.info(f"event: {event}")

            id_ = str(cnt).zfill(3)
            event = ConnpassSearchResult(
                url=url,
                title=title,
                body=body,
            )
            id2connpass[id_] = event
            exist_urls.append(url)

    return id2connpass


def recommend(user_preferences: str, user_id: str, urls: list[str]) -> list[Event]:
    it_queries = _generate_queries(user_preferences, "IT")
    fun_queries = _generate_queries(user_preferences, "趣味")
    both_queries = it_queries + fun_queries

    id2page: dict[str, GoogleSearchResult] = google_search(both_queries, urls)
    recommend_mapping: dict[str, RecommendResult] = _generate_recommend_results(user_preferences, id2page)
    google_events = _gather_events(id2page, recommend_mapping, user_id)

    it_queries = [query.replace(" ", ",") for query in it_queries]
    id2connpass = _search_connpass(it_queries, urls)
    recommend_mapping = _generate_recommend_results(user_preferences, id2connpass, fix_event_category=True)
    connpass_events = _gather_events(id2connpass, recommend_mapping, user_id)

    events = google_events + connpass_events
    return events


def crawl_events(user_id: str | None = None) -> tuple[str, int]:
    """
    ユーザーの好みをもとに、興味のありそうな情報をインターネットから取得する

    Args:
        user_id (str): ユーザーID

    Returns:
        tuple[str, int]: ステータスメッセージとHTTPステータスコード
    """
    if not user_id:
        user_ids = get_all_user_ids()
        for user_id in user_ids:
            crawl_events(user_id)
        return ("OK", 200)
    user_preferences = search_memory(user_id)
    urls = fetch_information_urls(user_id)
    events = recommend(user_preferences, user_id, urls)
    save_event_to_information(events)
    return ("OK", 200)
