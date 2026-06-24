#!/usr/bin/env python3
"""Stream large DLD CSVs and count entries by date range."""

import csv
import sys
from datetime import date, datetime

REF = date(2026, 6, 23)
Y1_START = date(2025, 6, 23)
M6_START = date(2025, 12, 23)


def parse_date(raw: str) -> date | None:
    if not raw:
        return None
    raw = raw.strip().strip('"')
    try:
        return datetime.strptime(raw[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def count_file(path: str, date_col: str, label: str) -> dict:
    total = y1 = m6 = 0
    min_d = max_d = None
    bad = 0

    print(f"\n{'='*60}\n{label}\n{path}\n{'='*60}", flush=True)

    with open(path, encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        if date_col not in (reader.fieldnames or []):
            print(f"ERROR: column '{date_col}' not found. Columns: {reader.fieldnames[:8]}...")
            sys.exit(1)

        for i, row in enumerate(reader, 1):
            total += 1
            d = parse_date(row.get(date_col, ""))
            if d is None:
                bad += 1
                continue
            if min_d is None or d < min_d:
                min_d = d
            if max_d is None or d > max_d:
                max_d = d
            if d >= Y1_START:
                y1 += 1
            if d >= M6_START:
                m6 += 1

            if i % 2_000_000 == 0:
                print(f"  … {i:,} rows scanned", flush=True)

    return {
        "label": label,
        "path": path,
        "total": total,
        "last_1y": y1,
        "last_6m": m6,
        "min_date": str(min_d) if min_d else None,
        "max_date": str(max_d) if max_d else None,
        "bad_dates": bad,
    }


def print_result(r: dict) -> None:
    print(f"\n  Total rows:        {r['total']:>12,}")
    print(f"  Date range:        {r['min_date']} → {r['max_date']}")
    print(f"  Bad/missing dates: {r['bad_dates']:>12,}")
    print(f"  Last 1 year (≥{Y1_START}): {r['last_1y']:>12,}  ({100*r['last_1y']/r['total']:.1f}%)" if r['total'] else "")
    print(f"  Last 6 months (≥{M6_START}): {r['last_6m']:>12,}  ({100*r['last_6m']/r['total']:.1f}%)" if r['total'] else "")


def main() -> None:
    rent_path = "/media/talha/26402263402239C7/data/rent_contracts_2026-05-30_18-51-21_2.csv"
    tx_path = "/media/talha/26402263402239C7/transactions_2026-05-29_02-08-58_2.csv.gz"

    print(f"Reference date (today): {REF}")
    print(f"Last 1 year:  {Y1_START} → {REF}")
    print(f"Last 6 months: {M6_START} → {REF}")

    rent = count_file(rent_path, "contract_start_date", "RENTAL CONTRACTS")
    print_result(rent)

    tx = count_file(tx_path, "instance_date", "TRANSACTIONS")
    print_result(tx)

    print(f"\n{'='*60}\nSUMMARY\n{'='*60}")
    print(f"{'':20} {'Total':>12} {'Last 1Y':>12} {'Last 6M':>12}")
    print(f"{'Rental':20} {rent['total']:>12,} {rent['last_1y']:>12,} {rent['last_6m']:>12,}")
    print(f"{'Transactions':20} {tx['total']:>12,} {tx['last_1y']:>12,} {tx['last_6m']:>12,}")


if __name__ == "__main__":
    main()
