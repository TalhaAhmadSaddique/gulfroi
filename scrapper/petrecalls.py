"""Scrape dog food recalls from petrecalls.com."""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from html import unescape
from urllib.parse import urljoin

import requests

BASE_URL = "https://petrecalls.com"
LIST_URL = f"{BASE_URL}/dog-food-recalls/"
YEAR_HEADING_RE = re.compile(r"Dog Food Recalls and Alerts for (\d{4})")
RECALL_ITEM_RE = re.compile(
    r'<li>\s*<a[^>]+href="(?P<href>[^"]+)"[^>]*>'
    r'<span class="recall-date">(?P<date>[^<]+)</span>'
    r'<span class="recall-title">(?P<title>[^<]+)</span>'
    r'<span class="recall-brand">(?P<brand>[^<]+)</span>'
    r"</a>\s*</li>",
    re.DOTALL,
)


@dataclass
class PetRecall:
    year: str
    date: str
    title: str
    brand: str
    url: str


def _clean(value: str) -> str:
    return unescape(re.sub(r"\s+", " ", value)).strip()


def scrape_petrecalls(url: str = LIST_URL) -> list[PetRecall]:
    response = requests.get(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout=30,
    )
    response.raise_for_status()
    html = response.text

    article_match = re.search(r"<article[^>]*>(.*)</article>", html, re.DOTALL)
    if not article_match:
        raise ValueError("Could not find article container on PetRecalls page")

    article_html = article_match.group(1)
    recalls: list[PetRecall] = []

    for heading_match in re.finditer(
        r"<h2[^>]*>Dog Food Recalls and Alerts for (\d{4})</h2>",
        article_html,
    ):
        year = heading_match.group(1)
        section_start = heading_match.end()
        next_heading = re.search(r"<h2[^>]*>", article_html[section_start:])
        section_end = section_start + next_heading.start() if next_heading else len(article_html)
        section_html = article_html[section_start:section_end]

        for item in RECALL_ITEM_RE.finditer(section_html):
            recalls.append(
                PetRecall(
                    year=year,
                    date=_clean(item.group("date")),
                    title=_clean(item.group("title")),
                    brand=_clean(item.group("brand")),
                    url=urljoin(BASE_URL, item.group("href")),
                )
            )

    return recalls


if __name__ == "__main__":
    items = scrape_petrecalls()
    print(f"Fetched {len(items)} recalls")
    for item in items[:5]:
        print(asdict(item))
