import logging
import os

import vertexai
from cloudevents.http import from_http
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from vertexai import agent_engines

from services import chat

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

vertexai.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("AGENT_ENGINE_LOCATION"),
    staging_bucket=os.getenv("GOOGLE_CLOUD_STORAGE_BUCKETS"),
)

agent = agent_engines.get(os.getenv("ADK_AGENT_ENGINE_ID"))


@app.post("/chat")
async def chat_route(request: Request) -> tuple[str, int]:
    data = await request.body()
    event = from_http(dict(request.headers), data)

    event_id = event.get("id")
    document = event.get("document")
    if not (isinstance(document, str) and isinstance(event_id, str)):
        raise ValueError("document is not a string")

    logger.info(f"Document path: {document}")
    parts = document.split("/")
    if len(parts) != 6:
        raise ValueError(f"Invalid document path format. Expected 6 parts, got {len(parts)}: {document}")

    _, user_id, _, session_id, _, message_id = parts

    logger.info(f"Received '/chat' request: {event_id}, {document}")

    try:
        await chat(event_id, user_id, session_id, message_id)
        return ("finished", 204)
    except Exception as e:
        logger.error(f"Error in '/chat' request: {e}")
        return ("error", 500)
