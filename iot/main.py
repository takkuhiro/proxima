import logging
import os
import time

import pychromecast
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.responses import Response
from starlette.staticfiles import StaticFiles

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NIJIVOICE_API_KEY = os.getenv("NIJIVOICE_API_KEY")
CHROMECAST_FRIENDLY_NAME = os.getenv("CHROMECAST_FRIENDLY_NAME")
PUBLIC_URL = os.getenv("PUBLIC_URL")
MP3_DIR = os.getenv("MP3_DIR")

if not NIJIVOICE_API_KEY:
    raise ValueError("NIJIVOICE_API_KEY is not set")

if not CHROMECAST_FRIENDLY_NAME:
    raise ValueError("CHROMECAST_FRIENDLY_NAME is not set")

if not PUBLIC_URL:
    raise ValueError("PUBLIC_URL is not set")

if not MP3_DIR:
    raise ValueError("MP3_DIR is not set")


class TalkRequest(BaseModel):
    id: str
    audio_signed_url: str


class PlayMediaRequest(BaseModel):
    file_name: str


# FastAPIで静的ファイル公開
app.mount("/mp3", StaticFiles(directory=MP3_DIR), name="mp3")


@app.get("/chromecast")
def list_chromecasts() -> Response:
    """
    スピーカーの一覧を取得する
    """
    try:
        chromecasts, browser = pychromecast.get_listed_chromecasts(friendly_names=[str(CHROMECAST_FRIENDLY_NAME)])
        logger.info(f"GET /chromecast: Found chromecasts: {chromecasts}")
        if not chromecasts:
            return Response(content="NG", media_type="text/plain")
        return Response(content="OK", media_type="text/plain")
    except Exception as e:
        logger.error(f"POST /chromecast: Failed to get chromecasts: {e}")
        return Response(content="NG", media_type="text/plain")
    finally:
        pychromecast.discovery.stop_discovery(browser)


@app.post("/talk")
def talk(request: TalkRequest) -> Response:
    """
    テキストを音声ファイルに変換してスピーカーで再生する
    - asyncだとpychromecastがデバイスを認識できないので、動機的に処理する
    Args:
        text (str): テキスト
    Returns:
        str: 音声ファイルのパス
    """
    try:
        # 指定した名前のデバイスを探す
        chromecasts, browser = pychromecast.get_listed_chromecasts(friendly_names=[str(CHROMECAST_FRIENDLY_NAME)])
        logger.info(f"POST /talk: Found chromecasts: {chromecasts}")
        if not chromecasts:
            logger.error("POST /talk: No chromecasts found")
            return Response(content="NG", media_type="text/plain")
        audio_signed_url = request.audio_signed_url
        logger.info(f"POST /talk: {audio_signed_url}")

        chromecast = chromecasts[0]
        media_controller = chromecast.media_controller
        manuscript_id = request.id

        # 音声ファイルをダウンロード
        response = requests.get(audio_signed_url)
        if response.status_code != 200:
            logger.error(f"POST /talk: Failed to download audio file: {response.status_code} {response.text}")
            return Response(content="NG", media_type="text/plain")
        file_name = f"audio_{manuscript_id}.mp3"
        file_path = os.path.join(str(MP3_DIR), file_name)
        logger.info(f"POST /talk: Downloading audio file to {file_path}")
        with open(file_path, "wb") as f:
            f.write(response.content)

        # 既に音声再生中の場合は停止
        if not chromecast.is_idle:
            logger.info("POST /talk: Killing current running app")
            chromecast.quit_app()
            time.sleep(3)

        # 音声ファイルを再生
        url = f"{PUBLIC_URL}/{MP3_DIR}/{file_name}"
        logger.info(f"POST /talk: play_media: {url}")
        chromecast.wait()
        media_controller.play_media(url, "audio/mp3")
        media_controller.block_until_active()
        logger.info("POST /talk: play_media done")
    except Exception as e:
        logger.error(f"POST /talk: Failed to play media: {e}")
        return Response(content="NG", media_type="text/plain")
    finally:
        pychromecast.discovery.stop_discovery(browser)

    return Response(content="OK", media_type="text/plain")


@app.post("/play_media")
def play_media(request: PlayMediaRequest) -> Response:
    """
    テキストを音声ファイルに変換してスピーカーで再生する
    - asyncだとpychromecastがデバイスを認識できないので、動機的に処理する
    Args:
        text (str): テキスト
    Returns:
        str: 音声ファイルのパス
    """
    try:
        # 指定した名前のデバイスを探す
        chromecasts, browser = pychromecast.get_listed_chromecasts(friendly_names=[str(CHROMECAST_FRIENDLY_NAME)])
        logger.info(f"POST /play_media: Found chromecasts: {chromecasts}")
        if not chromecasts:
            logger.error("POST /play_media: No chromecasts found")
            return Response(content="NG", media_type="text/plain")
        file_name = request.file_name
        logger.info(f"POST /play_media: {file_name}")

        chromecast = chromecasts[0]
        media_controller = chromecast.media_controller

        # 既に音声再生中の場合は停止
        if not chromecast.is_idle:
            logger.info("POST /play_media: Killing current running app")
            chromecast.quit_app()
            time.sleep(3)

        # 音声ファイルを再生
        url = f"{PUBLIC_URL}/{MP3_DIR}/{file_name}"
        logger.info(f"POST /play_media: play_media: {url}")
        chromecast.wait()
        media_controller.play_media(url, "audio/mp3")
        media_controller.block_until_active()
        logger.info("POST /play_media: play_media done")
    except Exception as e:
        logger.error(f"POST /play_media: Failed to play media: {e}")
        return Response(content="NG", media_type="text/plain")
    finally:
        pychromecast.discovery.stop_discovery(browser)

    return Response(content="OK", media_type="text/plain")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8080, workers=1)
