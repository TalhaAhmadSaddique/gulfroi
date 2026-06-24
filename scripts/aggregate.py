#!/usr/bin/env python3
"""
Aggregate real DLD transaction data into a lightweight market-summary.json
Run from project root:  python3 scripts/aggregate.py

Unit notes (DLD data):
  meter_sale_price  → AED per SQM
  procedure_area    → SQM
  ACTUAL_AREA (rent)→ SQM
  Our app displays  → AED per SQFT  (divide by SQFT_PER_SQM)
"""

import csv, json, os, collections, statistics
from datetime import date

SQFT_PER_SQM = 10.7639   # 1 sqm = 10.7639 sqft

TX_FILE   = "/media/talha/26402263402239C7/transactions_2026-05-29_02-08-58_2.csv.gz"
RENT_FILE = "/media/talha/26402263402239C7/data/rent_contracts_2026-05-30_18-51-21_2.csv"
OUT_FILE  = "data/market-summary.json"

CUT_OFF_DATE  = "2025-06-23"   # last 1 year from reference date 2026-06-23
MIN_TYPE_TX   = 5
MIN_AREA_TX   = 10

# ── Helpers ───────────────────────────────────────────────────

def p_sqft(price_sqm):
    """AED/sqm  →  AED/sqft"""
    return price_sqm / SQFT_PER_SQM

def a_sqft(area_sqm):
    """sqm  →  sqft"""
    return area_sqm * SQFT_PER_SQM

def svc_estimate(price_sqft):
    if price_sqft > 2500: return 30
    if price_sqft > 1800: return 22
    if price_sqft > 1200: return 16
    return 12

def quarter_of(date_str):
    try:
        y, m = int(date_str[:4]), int(date_str[5:7])
        q = (m - 1) // 3 + 1
        return f"Q{q} {y}", f"Q{q}", y
    except Exception:
        return None, None, None

RESI_TYPES = {"Flat", "Villa", "Stacked Townhouses", "Hotel Apartment"}
RENAME     = {"Stacked Townhouses": "Townhouse", "Hotel Apartment": "Hotel Apt"}


# ── 1. Parse sale transactions ────────────────────────────────

print("Reading transactions…")

# sale[area][subtype]["prices" | "quarters"][q]["prices","offplan","ready","areas"]
sale = collections.defaultdict(
    lambda: collections.defaultdict(lambda: {
        "prices": [],
        "quarters": collections.defaultdict(lambda: {
            "prices": [], "offplan": 0, "ready": 0, "areas": []
        })
    })
)

with open(TX_FILE, encoding="utf-8", errors="replace", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get("trans_group_en") != "Sales":           continue
        tx_date = row.get("instance_date", "")
        if tx_date < CUT_OFF_DATE:                            continue
        if row.get("property_usage_en", "").strip() != "Residential": continue

        area = row.get("area_name_en", "").strip()
        if not area:                                       continue

        price_sqm = float(row.get("meter_sale_price") or 0)
        if not (500 < price_sqm < 250_000):               continue

        sub_raw = (row.get("property_sub_type_en","").strip() or
                   row.get("property_type_en","").strip() or "Unit")
        if sub_raw not in RESI_TYPES:                      continue
        sub = RENAME.get(sub_raw, sub_raw)

        q_key, q_lbl, q_yr = quarter_of(tx_date)
        if not q_key:                                      continue

        is_offplan   = row.get("reg_type_en","").strip() == "Off-Plan Properties"
        area_sqm_val = float(row.get("procedure_area") or 0)

        sale[area][sub]["prices"].append(price_sqm)
        qb = sale[area][sub]["quarters"][q_key]
        qb["prices"].append(price_sqm)
        if is_offplan: qb["offplan"] += 1
        else:          qb["ready"]   += 1
        if area_sqm_val: qb["areas"].append(area_sqm_val)

print(f"  {sum(len(v['prices']) for a in sale.values() for v in a.values())} sale records, "
      f"{len(sale)} areas")


# ── 2. Parse rents (ACTUAL_AREA is in SQM) ───────────────────

print("Reading rents…")

# rent[AREA_UPPER][subtype] = [AED/sqm/year values]
rent = collections.defaultdict(lambda: collections.defaultdict(list))

if os.path.exists(RENT_FILE):
    rent_count = 0
    with open(RENT_FILE, encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            start = (row.get("contract_start_date") or "")[:10]
            if start < CUT_OFF_DATE:
                continue
            if row.get("property_usage_en", "").strip() != "Residential":
                continue
            area_r = row.get("area_name_en", "").strip()
            if not area_r:
                continue
            annual   = float(row.get("annual_amount") or 0)
            area_sqm = float(row.get("actual_area") or 0)   # SQM
            if not annual or area_sqm < 5:
                continue
            rps_sqm = annual / area_sqm                    # AED/sqm/year
            if not (50 < rps_sqm < 30_000):
                continue
            # ejari_property_type_en = Flat/Villa (not room-level sub_type)
            sub_raw = row.get("ejari_property_type_en", "").strip()
            if sub_raw not in RESI_TYPES:
                continue
            sub = RENAME.get(sub_raw, sub_raw)
            rent[area_r.upper()][sub].append(rps_sqm)
            rent_count += 1
    print(f"  {rent_count:,} rent records, {len(rent)} areas with rent data")
else:
    print("  No rent file — yield will be null")


# ── 3. Aggregate ──────────────────────────────────────────────

print("Aggregating…")

areas_out  = []
trends_out = {}

for area, type_map in sale.items():
    all_sale_sqm = [p for td in type_map.values() for p in td["prices"]]
    if len(all_sale_sqm) < MIN_AREA_TX:
        continue

    avg_area_sqm  = statistics.mean(all_sale_sqm)
    avg_area_sqft = p_sqft(avg_area_sqm)

    area_up  = area.upper()
    rent_map = rent.get(area_up, rent.get(area, {}))

    by_type           = []
    all_rents_sqm     = []

    for sub, td in type_map.items():
        if len(td["prices"]) < MIN_TYPE_TX:
            continue

        avg_p_sqm  = statistics.mean(td["prices"])
        avg_p_sqft = p_sqft(avg_p_sqm)

        rents_sqm   = rent_map.get(sub, [])
        if rents_sqm:
            avg_r_sqm   = statistics.mean(rents_sqm)
            avg_r_sqft  = p_sqft(avg_r_sqm)
            gross_yield = round((avg_r_sqm / avg_p_sqm) * 100, 1)
            all_rents_sqm.extend(rents_sqm)
        else:
            avg_r_sqft  = None
            gross_yield = None

        # Per-type quarterly points
        q_pts = []
        for q_key in sorted(td["quarters"]):
            qb = td["quarters"][q_key]
            if len(qb["prices"]) < 3:
                continue
            _, q_lbl, q_yr = quarter_of(q_key.replace("Q","") + "1 " + q_key[-4:])
            avg_qp  = statistics.mean(qb["prices"])
            med_qp  = statistics.median(qb["prices"])
            tot_tx  = qb["offplan"] + qb["ready"]
            avg_sz  = statistics.mean(qb["areas"]) if qb["areas"] else 0  # sqm
            q_pts.append({
                "quarter":            q_key,
                "quarterLabel":       f"Q{q_key[1]}",
                "year":               int(q_key[-4:]),
                "avgPricePerSqft":    round(p_sqft(avg_qp)),
                "medianPricePerSqft": round(p_sqft(med_qp)),
                "transactionCount":   tot_tx,
                "totalValue":         round(avg_qp * avg_sz * tot_tx),  # AED (sqm×sqm)
                "offPlanCount":       qb["offplan"],
                "readyCount":         qb["ready"],
                "avgActualArea":      round(a_sqft(avg_sz)),             # convert to sqft
            })

        by_type.append({
            "type":            sub,
            "avgPricePerSqft": round(avg_p_sqft),
            "avgRentPerSqft":  round(avg_r_sqft) if avg_r_sqft else None,
            "grossYieldPct":   gross_yield,
            "transactions":    len(td["prices"]),
            "quarters":        q_pts,
        })

    if not by_type:
        continue

    by_type.sort(key=lambda t: (t["grossYieldPct"] is None, t["type"]))

    avg_r_sqm_area  = statistics.mean(all_rents_sqm) if all_rents_sqm else None
    avg_r_sqft_area = p_sqft(avg_r_sqm_area) if avg_r_sqm_area else None
    avg_yield_area  = (round((avg_r_sqm_area / avg_area_sqm) * 100, 1)
                       if avg_r_sqm_area else None)

    areas_out.append({
        "area":                    area,
        "city":                    "Dubai",
        "avgPricePerSqft":         round(avg_area_sqft),
        "avgAnnualRentPerSqft":    round(avg_r_sqft_area) if avg_r_sqft_area else None,
        "avgGrossYieldPct":        avg_yield_area,
        "avgServiceChargePerSqft": svc_estimate(avg_area_sqft),
        "byType":                  by_type,
    })

    # ── Quarterly trend (all types combined) ──────────────────
    aq = collections.defaultdict(lambda: {"prices":[],"offplan":0,"ready":0,"areas":[]})
    for sub, td in type_map.items():
        for q_key, qb in td["quarters"].items():
            aq[q_key]["prices"].extend(qb["prices"])
            aq[q_key]["offplan"] += qb["offplan"]
            aq[q_key]["ready"]   += qb["ready"]
            aq[q_key]["areas"].extend(qb["areas"])

    trend_pts = []
    for q_key in sorted(aq):
        qb = aq[q_key]
        if len(qb["prices"]) < 5:
            continue
        avg_qp = statistics.mean(qb["prices"])
        med_qp = statistics.median(qb["prices"])
        tot_tx = qb["offplan"] + qb["ready"]
        avg_sz = statistics.mean(qb["areas"]) if qb["areas"] else 0
        trend_pts.append({
            "quarter":            q_key,
            "quarterLabel":       f"Q{q_key[1]}",
            "year":               int(q_key[-4:]),
            "avgPricePerSqft":    round(p_sqft(avg_qp)),
            "medianPricePerSqft": round(p_sqft(med_qp)),
            "transactionCount":   tot_tx,
            "totalValue":         round(avg_qp * avg_sz * tot_tx),
            "offPlanCount":       qb["offplan"],
            "readyCount":         qb["ready"],
            "avgActualArea":      round(a_sqft(avg_sz)),
        })

    if len(trend_pts) < 2:
        continue

    latest_p = trend_pts[-1]["avgPricePerSqft"]
    prev_p   = trend_pts[-2]["avgPricePerSqft"]

    # Find same quarter one year ago
    last_q_lbl = trend_pts[-1]["quarter"][0:2]   # "Q1","Q2"…
    last_yr    = trend_pts[-1]["year"]
    p_1y_pts   = [p for p in trend_pts
                  if p["year"] == last_yr - 1 and p["quarter"].startswith(last_q_lbl)]
    p_1y       = p_1y_pts[0]["avgPricePerSqft"] if p_1y_pts else None

    tot_off = sum(p["offPlanCount"] for p in trend_pts)
    tot_all = sum(p["transactionCount"] for p in trend_pts)
    off_shr = round(tot_off / tot_all * 100, 1) if tot_all else None

    v1 = trend_pts[-1]["transactionCount"]
    v2 = trend_pts[-2]["transactionCount"]
    vol = "up" if v1 > v2 * 1.1 else ("down" if v1 < v2 * 0.9 else "stable")

    trends_out[area] = {
        "area":             area,
        "quarters":         trend_pts,
        "priceChange1Y":    round((latest_p - p_1y) / p_1y * 100, 1) if p_1y else None,
        "priceChangeQoQ":   round((latest_p - prev_p) / prev_p * 100, 1),
        "latestAvgPrice":   latest_p,
        "volumeTrend":      vol,
        "offPlanShare":     off_shr,
    }

areas_out.sort(key=lambda a: a["area"])


# ── 4. Write JSON ─────────────────────────────────────────────

os.makedirs("data", exist_ok=True)
output = {
    "generatedAt": date.today().isoformat(),
    "source":      f"DLD Sales + Ejari Rents (last 1 year from {CUT_OFF_DATE})",
    "totalAreas":  len(areas_out),
    "areas":       areas_out,
    "trends":      trends_out,
}

with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

size_kb = os.path.getsize(OUT_FILE) / 1024
print(f"\nDone! → {OUT_FILE}  ({size_kb:.0f} KB)")
print(f"  Areas:  {len(areas_out)}")
print(f"  Trends: {len(trends_out)}")

# Quick sanity check
print("\nSanity check (top 3 by transactions):")
top3 = sorted(areas_out,
              key=lambda a: sum(t["transactions"] for t in a["byType"]),
              reverse=True)[:3]
for a in top3:
    print(f"  {a['area']}: AED {a['avgPricePerSqft']}/sqft, yield {a['avgGrossYieldPct']}%")
