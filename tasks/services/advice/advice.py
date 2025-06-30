import logging
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from google import genai
from ulid import ulid

from common.db import (
    fetch_career_goals_from_db,
    fetch_initiatives_from_db,
    fetch_tasks_from_db,
    save_advice_to_db,
    search_memory,
)
from common.firestore import get_all_user_ids
from common.schemas import Advice
from services.advice.instruction import CREATE_ADVICE_INSTRUCTION

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


def _generate_advice(career_goals: str, initiatives: str, tasks: str, memory: str) -> str:
    """
    ユーザーの情報をもとに、アドバイスを作成する
    """
    instruction = (
        CREATE_ADVICE_INSTRUCTION.replace("$CAREER_GOALS$", career_goals)
        .replace("$INITIATIVES$", initiatives)
        .replace("$TASKS$", tasks)
        .replace("$MEMORY$", memory)
    )
    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=instruction,
    )
    if response.text:
        return response.text
    else:
        return "エラーが発生しました"


def create_advice(user_id: str | None = None) -> tuple[str, int]:
    """
    ユーザーの情報をもとに、アドバイスを作成する
    """
    if not user_id:
        user_ids = get_all_user_ids()
        for user_id in user_ids:
            create_advice(user_id)
        return ("OK", 200)

    logger.info(f"Creating advice for user: {user_id}")
    career_goals = fetch_career_goals_from_db(user_id)
    initiatives = fetch_initiatives_from_db(user_id)
    tasks = fetch_tasks_from_db(user_id)
    memory = search_memory(user_id)

    markdown_advice = _generate_advice(career_goals, initiatives, tasks, memory)

    advice = Advice(
        id=ulid(),
        user_id=user_id,
        markdown=markdown_advice,
        created_at=datetime.now(ZoneInfo("Asia/Tokyo")),
        deleted=False,
    )

    result = save_advice_to_db(advice)
    if not result:
        return ("Error: データの保存に失敗しました。", 500)
    logger.info(f"Successfully created advice for user: {user_id}")
    return ("OK", 200)
