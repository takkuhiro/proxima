import logging
import os
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from google import genai
from ulid import ulid

from common.db import save_initiatives_to_db
from common.schemas import Initiative, InitiativeResult

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

CREATE_INITIATIVES_INSTRUCTION = """\
ユーザーのキャリアゴール情報をもとに、その達成に向けた中期目標（initiative）を3件生成してください。

### 中期目標（initiative）について
- 各initiativeは、キャリアゴール達成のための具体的な中期的なアクションや計画であること
- それぞれ異なる観点やアプローチで考えること
- initiativeの目標の内容(body)は、1日単位の具体的な行動を箇条書きで考えられる限り記載すること
- 各initiativeにtarget_period（例: "2024年12月まで" など）を必ず含めること

### 出力形式
- title: 中期目標のタイトル
- body: 中期目標を達成するための、1日単位の具体的な行動を箇条書きで考えられる限り記載した文章
- target_period: 目標の達成を目指す期間

### ユーザーのキャリアゴール情報
$CAREER_GOALS$

3件のinitiativeをJSON配列で出力してください。
"""


def _generate_initiatives(career_goals: str) -> list[InitiativeResult]:
    """
    ユーザーのキャリアゴール情報をもとに、中期目標（initiative）を生成する
    """
    instruction = CREATE_INITIATIVES_INSTRUCTION.replace("$CAREER_GOALS$", career_goals)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=instruction,
        config={
            "response_mime_type": "application/json",
            "response_schema": list[InitiativeResult],
        },
    )
    parsed: Any = response.parsed
    if not isinstance(parsed, list):
        raise ValueError("Invalid response from Gemini")
    initiative_results: list[InitiativeResult] = parsed
    return initiative_results


def _convert_initiative_results_to_initiatives(initiative_results: list[InitiativeResult], user_id: str) -> list[Initiative]:
    """
    InitiativeResultをInitiativeに変換する
    """
    cropped_results = initiative_results[:3]
    initiatives = [
        Initiative(
            id=ulid(),
            user_id=user_id,
            title=ir.title,
            body=ir.body,
            target_period=ir.target_period,
            created_at=datetime.now(ZoneInfo("Asia/Tokyo")),
            deleted=False,
        )
        for ir in cropped_results
    ]
    return initiatives


def create_initiatives(user_id: str, career_goals: str) -> tuple[str, int]:
    """
    キャリアゴール情報をもとに中期目標（initiative）を生成しDB保存
    """
    initiative_results = _generate_initiatives(career_goals)
    initiatives = _convert_initiative_results_to_initiatives(initiative_results, user_id)
    save_initiatives_to_db(initiatives)
    return ("OK", 200)
