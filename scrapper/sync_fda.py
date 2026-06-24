"""Run FDA sync and persist last_sync timestamp."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from fda import sync_dog_recalls

STATE_FILE = Path(__file__).parent / "output" / "fda_sync_state.json"
OUTPUT_FILE = Path(__file__).parent / "output" / "fda_new_recalls.json"


def load_last_sync() -> datetime | None:
    if not STATE_FILE.exists():
        return None

    payload = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    raw = payload.get("last_sync")
    if not raw:
        return None

    return datetime.fromisoformat(raw)


def save_last_sync(synced_at: datetime) -> None:
    STATE_FILE.parent.mkdir(exist_ok=True)
    STATE_FILE.write_text(
        json.dumps({"last_sync": synced_at.isoformat()}, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync new FDA dog food/treat recalls")
    parser.add_argument(
        "--since",
        help="ISO datetime override, e.g. 2026-01-01T00:00:00+00:00",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Ignore saved last_sync and fetch all dog records",
    )
    args = parser.parse_args()

    if args.full:
        last_sync = datetime.min.replace(tzinfo=timezone.utc)
    elif args.since:
        last_sync = datetime.fromisoformat(args.since)
    else:
        last_sync = load_last_sync()

    result = sync_dog_recalls(last_sync=last_sync)

    OUTPUT_FILE.parent.mkdir(exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps([record.to_dict() for record in result.new_records], indent=2),
        encoding="utf-8",
    )
    save_last_sync(result.last_sync)

    print(f"Last sync input: {last_sync.isoformat() if last_sync else 'none'}")
    print(f"Fetched from table: {result.fetched}")
    print(f"Dog food/treat records: {result.dog_relevant}")
    print(f"New records: {len(result.new_records)}")
    print(f"Saved -> {OUTPUT_FILE}")
    print(f"Updated last_sync -> {result.last_sync.isoformat()}")

    for record in result.new_records[:10]:
        print(
            f"  NEW {record.announced_at.date()} | {record.brand} | "
            f"{record.product[:55]}"
        )


if __name__ == "__main__":
    main()
