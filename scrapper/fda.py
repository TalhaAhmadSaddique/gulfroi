"""Fetch FDA recall table data and sync new dog food / treat records."""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html import unescape
from urllib.parse import urljoin

import requests

BASE_URL = "https://www.fda.gov"
LIST_URL = f"{BASE_URL}/safety/recalls-market-withdrawals-safety-alerts"
API_URL = f"{BASE_URL}/datatables/views/ajax"

# Website dropdown: "Animal & Veterinary" (NOT 2323 which is Food & Beverages).
ANIMAL_VET_FILTER = "2274"

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": LIST_URL,
}

TAG_RE = re.compile(r"<[^>]+>")
DATETIME_RE = re.compile(r'datetime="([^"]+)"')
DOG_RE = re.compile(r"\bdogs?\b|\bpupp(?:y|ies)\b|\bcanine\b", re.I)
CAT_RE = re.compile(r"\bcats?\b|\bkittens?\b|\bfeline\b", re.I)
OTHER_ANIMAL_RE = re.compile(
    r"\bbirds?\b|\bhedgehog\b|\bhamster\b|\brabbits?\b|\bhorses?\b|\bequine\b",
    re.I,
)


@dataclass
class FdaRecall:
    announced_at: datetime
    date_display: str
    brand: str
    product: str
    product_type: str
    reason: str
    company: str
    url: str
    external_id: str
    terminated: bool
    is_dog_relevant: bool

    def to_dict(self) -> dict:
        data = asdict(self)
        data["announced_at"] = self.announced_at.isoformat()
        return data


@dataclass
class SyncResult:
    last_sync: datetime
    fetched: int
    dog_relevant: int
    new_records: list[FdaRecall]


def _strip_html(value: str) -> str:
    if not value:
        return ""
    return unescape(TAG_RE.sub("", value)).strip()


def _extract_link(value: str) -> str:
    match = re.search(r'href="([^"]+)"', value or "")
    return match.group(1) if match else ""


def _parse_announced_at(date_html: str, date_display: str) -> datetime:
    match = DATETIME_RE.search(date_html or "")
    if match:
        raw = match.group(1).replace("Z", "+00:00")
        return datetime.fromisoformat(raw).astimezone(timezone.utc)

    for fmt in ("%m/%d/%Y", "%m/%d/%y"):
        try:
            parsed = datetime.strptime(date_display, fmt)
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    raise ValueError(f"Could not parse recall date: {date_display!r}")


def _external_id(url: str) -> str:
    slug = url.rstrip("/").rsplit("/", 1)[-1]
    return f"fda:{slug}"


def is_dog_relevant(
    brand: str,
    product: str,
    product_type: str,
    reason: str = "",
    company: str = "",
    url: str = "",
) -> bool:
    """
    Include only in two cases:
    1. Dog explicitly mentioned in brand / product / reason / company.
    2. Dog included anyhow — e.g. in URL slug or other record fields.

    Exclude cat-only and non-dog animals. Generic pet items with no dog signal are excluded.
    """
    explicit_text = " ".join([brand, product, reason, company])
    url_slug = url.rsplit("/", 1)[-1].replace("-", " ")
    full_text = " ".join([explicit_text, product_type, url_slug])

    has_explicit_dog = bool(DOG_RE.search(explicit_text))
    has_dog_anyhow = bool(DOG_RE.search(full_text))
    has_cat = bool(CAT_RE.search(explicit_text))

    if OTHER_ANIMAL_RE.search(full_text):
        return False

    if re.search(
        r"\blivestock\b|\bcattle\b|\bswine\b|\breptile\b|\binjection\b|\bfeed products\b",
        full_text,
        re.I,
    ):
        return False

    if has_cat and not has_dog_anyhow:
        return False

    return has_explicit_dog or has_dog_anyhow


def _get_view_dom_id(session: requests.Session) -> tuple[str, int]:
    response = session.get(LIST_URL, headers=DEFAULT_HEADERS, timeout=30)
    response.raise_for_status()

    dom_match = re.search(
        r'"view_dom_id":"([a-f0-9]+)"[^}]*"total_items":(\d+)',
        response.text,
    )
    if not dom_match:
        raise ValueError("Could not find FDA datatable config on page")

    return dom_match.group(1), int(dom_match.group(2))


def _build_table_params(
    *,
    view_dom_id: str,
    total_items: int,
    product_filter: str,
    terminated_recall: str,
    start: int,
    length: int,
    draw: int,
) -> dict[str, str | int]:
    params: dict[str, str | int] = {
        "search_api_fulltext": "",
        "field_regulated_product_field": product_filter,
        "field_terminated_recall": terminated_recall,
        "draw": draw,
        "start": start,
        "length": length,
        "search[value]": "",
        "search[regex]": "false",
        "_drupal_ajax": "1",
        "_wrapper_format": "drupal_ajax",
        "pager_element": 0,
        "view_args": "",
        "view_base_path": "safety/recalls-market-withdrawals-safety-alerts/datatables-data",
        "view_display_id": "recall_datatable_block_1",
        "view_dom_id": view_dom_id,
        "view_name": "recall_solr_index",
        "view_path": "/safety/recalls-market-withdrawals-safety-alerts",
        "total_items": total_items,
    }

    for index in range(8):
        params[f"columns[{index}][data]"] = index
        params[f"columns[{index}][name]"] = ""
        params[f"columns[{index}][searchable]"] = "true"
        params[f"columns[{index}][orderable]"] = "true" if index < 6 else "false"
        params[f"columns[{index}][search][value]"] = ""
        params[f"columns[{index}][search][regex]"] = "false"

    return params


def _parse_table_row(row: list[str]) -> FdaRecall:
    date_html = row[0]
    brand_html = row[1]
    date_display = _strip_html(date_html)
    brand = _strip_html(brand_html)
    product = _strip_html(row[2])
    product_type = _strip_html(row[3])
    reason = _strip_html(row[4])
    company = _strip_html(row[5])
    terminated = _strip_html(row[6]).lower() == "terminated"
    url = urljoin(BASE_URL, _extract_link(brand_html))

    return FdaRecall(
        announced_at=_parse_announced_at(date_html, date_display),
        date_display=date_display,
        brand=brand,
        product=product,
        product_type=product_type,
        reason=reason,
        company=company,
        url=url,
        external_id=_external_id(url),
        terminated=terminated,
        is_dog_relevant=is_dog_relevant(brand, product, product_type, reason, company, url),
    )


def fetch_table_records(
    *,
    product_filter: str = ANIMAL_VET_FILTER,
    terminated_recall: str = "All",
    page_size: int = 50,
    session: requests.Session | None = None,
) -> list[FdaRecall]:
    """Fetch all rows from the FDA recalls table (same source as the website)."""
    http = session or requests.Session()
    view_dom_id, total_items = _get_view_dom_id(http)

    recalls: list[FdaRecall] = []
    start = 0
    total = None
    draw = 1

    while total is None or start < total:
        params = _build_table_params(
            view_dom_id=view_dom_id,
            total_items=total_items,
            product_filter=product_filter,
            terminated_recall=terminated_recall,
            start=start,
            length=page_size,
            draw=draw,
        )

        response = http.get(
            API_URL,
            params=params,
            headers={
                **DEFAULT_HEADERS,
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest",
            },
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()

        total = payload["recordsTotal"]
        rows = payload.get("data", [])
        if not rows:
            break

        recalls.extend(_parse_table_row(row) for row in rows)
        start += page_size
        draw += 1

    return recalls


def filter_dog_records(records: list[FdaRecall]) -> list[FdaRecall]:
    return [record for record in records if record.is_dog_relevant]


def get_new_records(
    records: list[FdaRecall],
    last_sync: datetime,
    *,
    include_equal: bool = False,
) -> list[FdaRecall]:
    """Return records announced after last_sync (UTC)."""
    if last_sync.tzinfo is None:
        last_sync = last_sync.replace(tzinfo=timezone.utc)
    else:
        last_sync = last_sync.astimezone(timezone.utc)

    def is_new(record: FdaRecall) -> bool:
        if include_equal:
            return record.announced_at >= last_sync
        return record.announced_at > last_sync

    return sorted(
        [record for record in records if is_new(record)],
        key=lambda record: record.announced_at,
        reverse=True,
    )


def sync_dog_recalls(
    last_sync: datetime | None = None,
    *,
    terminated_recall: str = "All",
) -> SyncResult:
    """
    1. Fetch FDA table (Animal & Veterinary)
    2. Keep dog food / treat records
    3. Return only records newer than last_sync
    """
    if last_sync is None:
        last_sync = datetime.min.replace(tzinfo=timezone.utc)
    elif last_sync.tzinfo is None:
        last_sync = last_sync.replace(tzinfo=timezone.utc)
    else:
        last_sync = last_sync.astimezone(timezone.utc)

    all_records = fetch_table_records(terminated_recall=terminated_recall)
    dog_records = filter_dog_records(all_records)
    new_records = get_new_records(dog_records, last_sync)

    return SyncResult(
        last_sync=datetime.now(timezone.utc),
        fetched=len(all_records),
        dog_relevant=len(dog_records),
        new_records=new_records,
    )


if __name__ == "__main__":
    result = sync_dog_recalls(last_sync=datetime(2026, 1, 1, tzinfo=timezone.utc))
    print(f"Fetched: {result.fetched}, dog relevant: {result.dog_relevant}")
    print(f"New since 2026-01-01: {len(result.new_records)}")
    for record in result.new_records[:10]:
        print(
            f"  {record.date_display} | {record.brand[:30]} | "
            f"{record.product[:45]} | terminated={record.terminated}"
        )
