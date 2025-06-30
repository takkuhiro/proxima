import logging
import os
import re
from concurrent.futures import ThreadPoolExecutor

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from googleapiclient.discovery import build

from common.schemas import GoogleSearchResult

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


API_KEY = os.getenv("GOOGLE_PROGRAMMABLE_SEARCH_API_KEY")
CSE_ID = os.getenv("GOOGLE_PROGRAMMABLE_SEARCH_CSE_ID")


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


def google_search(queries: list[str], exist_urls: list[str] | None = None) -> dict[str, GoogleSearchResult]:
    """
    Google検索を行う関数

    :param queries: 検索クエリ
    :return: 検索結果
    """
    logger.info(f"google_search: {queries}")
    service = build("customsearch", "v1", developerKey=API_KEY)
    id2page: dict[str, GoogleSearchResult] = {}
    cnt = 1
    for query in queries:
        res = service.cse().list(q=query, cx=CSE_ID, start=1, num=2, lr="lang_ja").execute()
        items = []
        urls = []
        titles = []
        for item in res["items"]:
            if exist_urls and item["link"] in exist_urls:
                continue
            items.append(item)
            urls.append(item["link"])
            titles.append(item["title"])

        max_workers = max(len(items), 1)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(_scrape_page, urls))
        for url, title, result in zip(urls, titles, results, strict=False):
            id_ = str(cnt).zfill(3)
            id2page[id_] = GoogleSearchResult(url=url, title=title, body=result)
            cnt += 1
    return id2page
