from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Memory(BaseModel):
    id: str
    user_id: str
    category: Literal["基本情報", "キャリア", "学習傾向", "興味のあるIT技術", "趣味", "エージェントの思考", "その他"]
    content: str
    created_at: datetime
    updated_at: datetime


class Event(BaseModel):
    id: str
    user_id: str
    url: str
    category: str
    title: str
    body: str
    recommend_level: int
    recommend_sentence: str
    favorite: bool
    created_at: datetime


class GoogleSearchResult(BaseModel):
    url: str
    title: str
    body: str


# 後ほどのスキーマ変更に備えて定義する
class ConnpassSearchResult(BaseModel):
    url: str
    title: str
    body: str


class RecommendResult(BaseModel):
    id: str
    category: Literal["IT", "イベント", "趣味", "スポット", "その他"]
    recommend_level: int
    recommend_sentence: str = Field(
        description=(
            "この記事に対する一言メッセージ。なぜユーザーにおすすめするのかの理由やその記事に対する感想などを20文字以内で表す。"
            "この一言を発するキャラクター像は素直, さわやか, 軽快で、"
            "「~~だよ」「~~面白そうだね」「いい感じ！」と言ったフレーズをよく発言します。"
            "このキャラクター像に合わせた一言メッセージをお願いします。"
        )
    )


class QuestResult(BaseModel):
    title: str
    description: str
    recommend: str
    estimated_time: Literal["5分", "10分", "15分", "30分", "1時間", "1時間以上"]
    category: Literal[
        "学習",
        "開発",
        "調査",
        "SNS",
        "OSS",
        "ブログ",
        "イベント",
        "趣味",
        "その他",
    ]


class Quest(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    recommend: str
    estimated_time: Literal["5分", "10分", "15分", "30分", "1時間", "1時間以上"]
    category: Literal[
        "学習",
        "開発",
        "調査",
        "SNS",
        "OSS",
        "ブログ",
        "イベント",
        "趣味",
        "その他",
    ]
    completed: bool
    created_at: datetime


class Manuscript(BaseModel):
    id: str
    user_id: str
    character_id: str
    manuscript: str
    ref_info_ids: str
    ref_tasks_ids: str
    created_at: datetime
    updated_at: datetime
    audio_gcs_path: str
    audio_signed_url: str


class InitiativeResult(BaseModel):
    title: str
    body: str
    target_period: str


class Initiative(BaseModel):
    id: str
    user_id: str
    title: str
    body: str
    target_period: str
    created_at: datetime
    deleted: bool


class ExtractMemory(BaseModel):
    necessary: bool = Field(description="保存すべき情報が含まれているかどうかの判定結果")
    contents: list[str] = Field(description="necessaryがTrueの場合の保存内容のリスト")


class Advice(BaseModel):
    id: str
    user_id: str
    markdown: str
    created_at: datetime
    deleted: bool


class CareerGoal(BaseModel):
    id: str
    user_id: str
    career_title: str
    career_body: str
    target_period: str
    created_at: datetime
    deleted: bool


class Routine(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    frequency: str
    time: str
    streak: int
    category: str
    completed: bool
    created_at: datetime
    deleted: bool
