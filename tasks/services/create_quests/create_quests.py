import logging
import os
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from google import genai
from ulid import ulid

from common.db import (
    fetch_initiatives_from_db,
    fetch_quests_from_information,
    save_quests_to_information,
    search_memory,
)
from common.firestore import get_all_user_ids
from common.schemas import Quest, QuestResult
from services.create_quests.instruction import CREATE_QUESTS_INSTRUCTION

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


def _generate_quests(user_preferences: str, past_quests: str, initiatives: str) -> list[QuestResult]:
    """
    ユーザーの情報をもとに、クエストを作成する
    """
    instruction = (
        CREATE_QUESTS_INSTRUCTION.replace("$USER_PREFERENCES$", user_preferences)
        .replace("$PAST_QUESTS$", past_quests)
        .replace("$INITIATIVES$", initiatives)
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=instruction,
        config={
            "response_mime_type": "application/json",
            "response_schema": list[QuestResult],
        },
    )
    parsed: Any = response.parsed
    if not isinstance(parsed, list):
        raise ValueError("Invalid response from Gemini")
    quest_results: list[QuestResult] = parsed
    return quest_results


def _convert_quest_results_to_quests(quest_results: list[QuestResult], user_id: str) -> list[Quest]:
    """
    クエスト結果をクエストに変換する
    """
    if len(quest_results) < 3:
        cropped_quest_results = quest_results
    else:
        logger.info(f"Cropping quest results: {quest_results}")
        cropped_quest_results = quest_results[:3]

    quests = [
        Quest(
            id=ulid(),
            user_id=user_id,
            category=quest_result.category,
            title=quest_result.title,
            description=quest_result.description,
            recommend=quest_result.recommend,
            estimated_time=quest_result.estimated_time,
            completed=False,
            created_at=datetime.now(ZoneInfo("Asia/Tokyo")),
        )
        for quest_result in cropped_quest_results
    ]
    return quests


def create_quests(user_id: str | None = None) -> tuple[str, int]:
    """
    ユーザーの情報をもとに、クエストを作成する
    """
    if not user_id:
        user_ids = get_all_user_ids()
        for user_id in user_ids:
            create_quests(user_id)
        return ("OK", 200)
    user_preferences = search_memory(user_id)
    initiatives = fetch_initiatives_from_db(user_id)
    past_quests = fetch_quests_from_information(user_id)
    quest_results = _generate_quests(user_preferences, past_quests, initiatives)
    quests = _convert_quest_results_to_quests(quest_results, user_id)
    save_quests_to_information(quests)
    return ("OK", 200)
