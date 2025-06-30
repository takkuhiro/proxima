import logging

import flask
import functions_framework
from dotenv import load_dotenv
from flask import Response

from services.advice.advice import create_advice
from services.crawl_events.crawl_events import crawl_events
from services.create_initiatives.create_initiatives import create_initiatives
from services.create_quests.create_quests import create_quests
from services.manuscript.iot import send_request_iot
from services.manuscript.manuscript import create_manuscript
from services.news.news import create_news_audio
from services.routine.routine import routine
from services.save_old_memory.save_old_memory import save_old_memory

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@functions_framework.http
def crawl_events_entry_point(request: flask.Request) -> tuple[str, int]:
    logger.info("Received request")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        if request_json and "user_id" in request_json:
            user_id = request_json["user_id"]
            status = crawl_events(user_id)
        else:
            status = crawl_events()
    else:
        raise ValueError("Content-Type is not application/json")
    return status


@functions_framework.http
def create_quest_entry_point(request: flask.Request) -> tuple[str, int]:
    logger.info("Received request")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        if request_json and "user_id" in request_json:
            user_id = request_json["user_id"]
            status = create_quests(user_id)
        else:
            status = create_quests()
    else:
        raise ValueError("Content-Type is not application/json")
    return status


@functions_framework.http
def manuscript_entry_point(request: flask.Request) -> tuple[str, int]:
    logger.info("Received request")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        if request_json and "user_id" in request_json:
            user_id = request_json["user_id"]
            status = create_manuscript(user_id)
        else:
            status = create_manuscript()
    else:
        raise ValueError("Content-Type is not application/json")
    return status


@functions_framework.http
def send_request_iot_entry_point(request: flask.Request) -> tuple[str, int]:
    logger.info("Received request for send_request_iot")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        if request_json and "user_id" in request_json:
            user_id = request_json["user_id"]
            status = send_request_iot(user_id)
        else:
            status = send_request_iot()
    else:
        raise ValueError("Content-Type is not application/json")
    return status


@functions_framework.http
def create_initiatives_entry_point(request: flask.Request) -> tuple[str, int]:
    logger.info("Received request for create_initiatives")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        user_id = request_json.get("userId") if request_json else None
        career_goals = request_json.get("careerGoals") if request_json else None
        if not (user_id and career_goals):
            return ("Error: user_id and career_goals are required", 400)
        status = create_initiatives(user_id, career_goals)
    else:
        raise ValueError("Content-Type is not application/json")
    return status


# 3日以上経ったsessionはmemoryに追加する
@functions_framework.http
def save_old_memory_entry_point(request: flask.Request) -> tuple[str, int]:
    logger.info("Received request for save_old_memory")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        user_id = request_json.get("user_id") if request_json else None
        if user_id:
            status = save_old_memory(user_id)
        else:
            status = save_old_memory()
    else:
        raise ValueError("Content-Type is not application/json")
    return status


@functions_framework.http
def advice_entry_point(request: flask.Request) -> tuple[str, int]:
    logger.info("Received request for advice")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        user_id = request_json.get("user_id") if request_json else None
        if user_id:
            status = create_advice(user_id)
        else:
            status = create_advice()
    else:
        raise ValueError("Content-Type is not application/json")
    return status


@functions_framework.http
def routine_entry_point(request: flask.Request) -> tuple[str, int]:
    logger.info("Received request for routine")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        user_id = request_json.get("user_id") if request_json else None
        if user_id:
            status = routine(user_id)
        else:
            status = routine()
    else:
        raise ValueError("Content-Type is not application/json")
    return status


@functions_framework.http
def news_entry_point(request: flask.Request) -> Response:
    logger.info("Received request for news")
    content_type = request.headers["content-type"]
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        user_id = request_json.get("user_id") if request_json else None
        if user_id:
            signed_url = create_news_audio(user_id)
        else:
            signed_url = create_news_audio()
    else:
        raise ValueError("Content-Type is not application/json")
    return flask.jsonify({"signed_url": signed_url})
