"""Quick smoke test for recall scrapers."""

from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from fda import fetch_table_records, filter_dog_records, get_new_records
from petrecalls import scrape_petrecalls

OUTPUT_DIR = Path(__file__).parent / "output"


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("=== PetRecalls ===")
    petrecalls = scrape_petrecalls()
    print(f"Total: {len(petrecalls)}")
    for item in petrecalls[:3]:
        print(f"  [{item.year}] {item.date} | {item.brand} | {item.title[:70]}")

    petrecalls_path = OUTPUT_DIR / "petrecalls_sample.json"
    petrecalls_path.write_text(
        json.dumps([asdict(item) for item in petrecalls[:10]], indent=2),
        encoding="utf-8",
    )
    print(f"Saved sample -> {petrecalls_path}")

    print("\n=== FDA table sync (Animal & Veterinary) ===")
    all_records = fetch_table_records()
    dog_records = filter_dog_records(all_records)
    new_records = get_new_records(dog_records, datetime(2026, 1, 1, tzinfo=timezone.utc))

    print(f"Table total: {len(all_records)}")
    print(f"Dog food/treat: {len(dog_records)}")
    print(f"New since 2026-01-01: {len(new_records)}")

    for item in dog_records[:5]:
        print(f"  {item.date_display} | {item.brand} | {item.product[:55]}")

    fda_path = OUTPUT_DIR / "fda_dog_records_sample.json"
    fda_path.write_text(
        json.dumps([record.to_dict() for record in dog_records[:10]], indent=2),
        encoding="utf-8",
    )
    print(f"Saved sample -> {fda_path}")


if __name__ == "__main__":
    main()
