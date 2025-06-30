import logging
import os
import random
from datetime import datetime

from google import genai
from ulid import ulid

from common.db import fetch_today_tasks, fetch_top3_today_information, save_manuscript_to_manuscripts
from common.firestore import get_all_user_ids
from common.schemas import Manuscript
from services.manuscript.characters import CHARACTERS
from services.manuscript.instruction import INSTRUCTION

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


def _rewrite_manuscript_with_character(manuscript_text: str, character_profile: str) -> str:
    """
    Geminiでキャラクター性を持たせた発話に修正
    """

    instruction = INSTRUCTION.replace("$MANUSCRIPT$", manuscript_text).replace("$CHARACTER_PROFILE$", character_profile)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=instruction,
        config={
            "response_mime_type": "text/plain",
        },
    )
    if not isinstance(response.text, str):
        raise Exception("Gemini APIから不正なレスポンスが返されました")
    return response.text.strip()


def create_manuscript(user_id: str | None = None) -> tuple[str, int]:
    """
    今日のinformation, tasksから原稿を生成しmanuscriptsテーブルに保存する
    """
    if not user_id:
        user_ids = get_all_user_ids()
        for user_id in user_ids:
            create_manuscript(user_id)
        return ("OK", 200)
    logger.info(f"Creating manuscript for user: {user_id}")
    info_list = fetch_top3_today_information(user_id)
    task_list = fetch_today_tasks(user_id)

    # 原稿生成
    manuscript_lines = []
    manuscript_lines.append("おはよう。よく眠れた？\n")
    if info_list:
        manuscript_lines.append("まずは今日のお役立ち情報から紹介するね。\n")
        for i, info in enumerate(info_list, 1):
            manuscript_lines.append(f"{i}. {info['title']} \n{info['body'][:80]}...\n")
    else:
        manuscript_lines.append("ってあれ？今日のお役立ち情報は収集に失敗してるみたい。\n")

    if task_list:
        manuscript_lines.append("最後に今日マスターに与えられたタスクを紹介するよ！\n")
        for i, task in enumerate(task_list, 1):
            manuscript_lines.append(
                f"{i}つ目. {task['title']} \n{task['description']}\n所要時間: {task['estimated_time']}\n{task['recommend']}\n"
            )
    else:
        manuscript_lines.append("本日のタスクはありません。\n")

    manuscript_lines.append("今日も一日頑張ろうね")
    manuscript_text = "".join(manuscript_lines)

    # キャラクター性を持たせた原稿に修正
    character_id, character_profile = random.choice(list(CHARACTERS.items()))
    logger.info(f"Selected Character ID: {character_id}")
    manuscript_text = _rewrite_manuscript_with_character(manuscript_text, character_profile)

    ref_info_ids = ",".join([info["id"] for info in info_list]) if info_list else ""
    ref_tasks_ids = ",".join([task["id"] for task in task_list]) if task_list else ""

    manuscript = Manuscript(
        id=ulid(),
        user_id=user_id,
        character_id=character_id,
        manuscript=manuscript_text,
        ref_info_ids=ref_info_ids,
        ref_tasks_ids=ref_tasks_ids,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        audio_gcs_path="",
        audio_signed_url="",
    )
    save_manuscript_to_manuscripts(manuscript)
    logger.info("Manuscript created")
    return ("OK", 200)
