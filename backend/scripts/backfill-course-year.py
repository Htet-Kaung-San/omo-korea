"""
Backfill course.recommended_year from the official PNU 2026-1 catalog.

The recommendation engine scores a year signal, but the live `course` table has
no year column, so a 1st-year and a 4th-year student in the same major get an
identical list. `backend/supabase/course_recommended_year.sql` adds the column;
this fills it in.

    python3 scripts/backfill-course-year.py --dry-run   # report only, no writes
    python3 scripts/backfill-course-year.py             # apply

This UPDATEs existing rows in place. It deliberately does NOT re-seed:
`seed-courses-from-catalog.mjs` deletes then re-inserts per major, and since the
course_offering foreign key is ON DELETE CASCADE, re-seeding would silently
destroy the live course_offering / course_metadata rows and rotate every
course_id. Updating in place touches nothing else.

Idempotent — re-running writes the same values.

Requires openpyxl (already needed by parse-catalog.py) and the source workbook
in the repository root, plus SUPABASE_URL / SUPABASE_SECRET_KEY in backend/.env.
"""

import collections
import json
import os
import re
import sys
import urllib.error
import urllib.request

XLSX = "2. 2026학년도 1학기 학부 개설강좌 일람표(26.1.28.기준).xlsx"
SHEET = "개설강좌일람표"
# Only major courses were seeded, so only those are matched back.
MAJOR_CATS = {"전공필수", "전공기초", "전공선택"}
DRY_RUN = "--dry-run" in sys.argv

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKBOOK = os.path.join(BACKEND, "..", XLSX)


def load_env():
    env = {}
    with open(os.path.join(BACKEND, ".env"), encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip().strip('"').strip("'")
    return env


ENV = load_env()
BASE = ENV["SUPABASE_URL"].rstrip("/")
KEY = ENV.get("SUPABASE_SECRET_KEY") or ENV["SUPABASE_KEY"]
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}


def request(method, path, payload=None):
    req = urllib.request.Request(
        f"{BASE}/rest/v1/{path}",
        method=method,
        headers=HEADERS,
        data=json.dumps(payload).encode() if payload is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode()
            return json.loads(body) if body.strip() else []
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"✗ {method} {path} -> HTTP {exc.code}: {exc.read().decode()[:300]}")


def korean_name(name):
    """
    Majors 2, 7 and 8 (EE, AI, CSE) were hand-entered with bilingual names —
    'Discrete Mathematics (이산수학)' — while the catalog carries the Korean name
    alone. parse-catalog.py skips those majors (SKIP_MAJORS), so a literal name
    match leaves exactly those three with no year at all. Take everything from
    the first Hangul character onward and drop the wrapper's closing paren,
    which also handles nested cases like 'General Physics (I) (일반물리학(I))'.
    """
    match = re.search(r"[가-힣]", name)
    if not match:
        return None
    candidate = name[match.start() :]
    while candidate.count(")") > candidate.count("("):
        candidate = candidate[:-1]
    candidate = candidate.strip()
    return candidate if candidate and candidate != name else candidate or None


def parse_year(raw):
    """'3학년' -> 3.  '전학년' (all years) -> None, meaning no restriction."""
    text = str(raw or "").strip()
    if not text or text == "전학년" or not text.endswith("학년"):
        return None
    return int(text[0]) if text[0].isdigit() else None


def read_catalog():
    try:
        import openpyxl
    except ImportError:
        raise SystemExit(
            "✗ openpyxl is required (same dependency as parse-catalog.py).\n"
            "  pip install openpyxl"
        )
    if not os.path.exists(WORKBOOK):
        raise SystemExit(
            f"✗ Source workbook not found: {XLSX}\n"
            "  It is gitignored and lives in the repository root. Without it this\n"
            "  script cannot run — it will not guess year levels."
        )

    workbook = openpyxl.load_workbook(WORKBOOK, read_only=True, data_only=True)
    sheet = workbook[SHEET]
    # name -> dept -> set(years);  and name -> set(years) as the fallback
    by_dept = collections.defaultdict(lambda: collections.defaultdict(set))
    by_name = collections.defaultdict(set)
    for row in sheet.iter_rows(min_row=8, values_only=True):
        if not row or row[7] is None or row[8] not in MAJOR_CATS:
            continue
        year = parse_year(row[4])
        if year is None:
            continue
        name = str(row[7]).strip()
        dept = str(row[3]).strip() if row[3] else ""
        by_dept[name][dept].add(year)
        by_name[name].add(year)
    return by_dept, by_name


def fetch_courses():
    courses, page = [], 0
    while True:
        batch = request(
            "GET",
            f"course?select=course_id,major_id,course_name&order=course_id"
            f"&offset={page * 1000}&limit=1000",
        )
        courses.extend(batch)
        if len(batch) < 1000:
            return courses
        page += 1


def dominant_dept_per_major(courses, by_dept):
    """
    Derive department -> major_id from the data that is already seeded, rather
    than duplicating the hand-built mapping in parse-catalog.py. Whatever that
    script decided is reflected in the rows, so this stays correct even if the
    mapping there is edited later.
    """
    votes = collections.defaultdict(collections.Counter)
    for course in courses:
        for dept in by_dept.get(course["course_name"], {}):
            votes[course["major_id"]][dept] += 1
    return {major: counter.most_common(1)[0][0] for major, counter in votes.items() if counter}


def main():
    by_dept, by_name = read_catalog()
    courses = fetch_courses()
    print(f"Catalog: {len(by_name)} named major courses carrying a year level")
    print(f"Database: {len(courses)} course rows\n")

    major_dept = dominant_dept_per_major(courses, by_dept)
    print(f"Resolved a source department for {len(major_dept)} major(s) from existing rows.\n")

    updates, unmatched, ambiguous, via_korean = {}, 0, 0, 0
    for course in courses:
        name = course["course_name"]
        depts = by_dept.get(name)
        if not depts:
            # Fall back to the Korean portion of a bilingual name.
            alternate = korean_name(name)
            if alternate and alternate != name and alternate in by_dept:
                depts = by_dept[alternate]
                name = alternate
                via_korean += 1
        if not depts:
            unmatched += 1
            continue

        preferred = major_dept.get(course["major_id"])
        years = depts.get(preferred) if preferred in depts else None
        if not years:
            years = by_name[name]
            if len(years) > 1:
                ambiguous += 1
        # Earliest year the course is offered — a 2nd-year should see a course
        # that opens in year 2 even if it also runs for 3rd-years.
        updates[course["course_id"]] = min(years)

    print(f"  matched      : {len(updates)}")
    print(f"    via Korean : {via_korean}  (bilingual names in the hand-entered majors)")
    print(f"  unmatched    : {unmatched}  (left NULL — no year restriction)")
    print(f"  ambiguous    : {ambiguous}  (same name, several years; earliest used)\n")

    spread = collections.Counter(updates.values())
    print("=== resulting year distribution ===")
    for year in sorted(spread):
        print(f"  year {year}: {spread[year]:5d}")

    if DRY_RUN:
        print("\n--dry-run: nothing written.")
        return

    # One PATCH per distinct year, filtered by id list, rather than 1,875
    # single-row requests.
    print("\nWriting...")
    written = 0
    for year in sorted(spread):
        ids = [cid for cid, value in updates.items() if value == year]
        for start in range(0, len(ids), 200):
            chunk = ids[start : start + 200]
            request(
                "PATCH",
                f"course?course_id=in.({','.join(str(i) for i in chunk)})",
                {"recommended_year": year},
            )
            written += len(chunk)
        print(f"  year {year}: {len(ids)} row(s)")

    print(f"\nDone. {written} row(s) updated, {unmatched} left NULL.")


if __name__ == "__main__":
    main()
