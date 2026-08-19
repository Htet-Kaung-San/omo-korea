#!/usr/bin/env python3
"""Read-only structural audit for the reviewed PNU academic source workbooks.

Uses only Python's standard library so the audit does not depend on Excel,
LibreOffice, or a third-party parser. It never edits the source workbooks.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILES = (
    ROOT / "data/source/department-websites/PNU_Department_Official_Websites.xlsx",
    ROOT / "data/source/economics-and-international-trade/trade_courses.xlsx",
    ROOT / "data/source/economics-and-international-trade/global_studies_courses.xlsx",
    ROOT
    / "data/source/economics-and-international-trade/tourism_convention_courses_2021_2026.xlsx",
)

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def column_number(reference: str) -> int:
    match = re.match(r"([A-Z]+)", reference)
    if not match:
        raise ValueError(f"Invalid cell reference: {reference}")
    value = 0
    for char in match.group(1):
        value = value * 26 + ord(char) - 64
    return value


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    strings = []
    for item in root.findall(f"{{{MAIN_NS}}}si"):
        strings.append("".join(node.text or "" for node in item.iter(f"{{{MAIN_NS}}}t")))
    return strings


def sheet_targets(archive: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in relationships.findall(f"{{{PKG_REL_NS}}}Relationship")
    }
    sheets = []
    sheet_collection = workbook.find(f"{{{MAIN_NS}}}sheets")
    for sheet in [] if sheet_collection is None else sheet_collection:
        relation_id = sheet.attrib[f"{{{REL_NS}}}id"]
        target = targets[relation_id].replace("\\", "/")
        if target.startswith("/"):
            archive_path = target.lstrip("/")
        elif target.startswith("xl/"):
            archive_path = target
        else:
            archive_path = f"xl/{target}"
        sheets.append((sheet.attrib["name"], archive_path))
    return sheets


def cell_value(cell: ET.Element, shared_strings: list[str]):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        inline = cell.find(f"{{{MAIN_NS}}}is")
        if inline is None:
            return ""
        return "".join(node.text or "" for node in inline.iter(f"{{{MAIN_NS}}}t"))
    value = cell.find(f"{{{MAIN_NS}}}v")
    if value is None or value.text is None:
        return None
    if cell_type == "s":
        return shared_strings[int(value.text)]
    if cell_type == "b":
        return value.text == "1"
    if cell_type in {"str", "e"}:
        return value.text
    number = float(value.text)
    return int(number) if number.is_integer() else number


def read_sheet(archive: zipfile.ZipFile, path: str, shared_strings: list[str]):
    root = ET.fromstring(archive.read(path))
    rows = []
    formulas = 0
    for row in root.findall(f".//{{{MAIN_NS}}}sheetData/{{{MAIN_NS}}}row"):
        values = {}
        for cell in row.findall(f"{{{MAIN_NS}}}c"):
            reference = cell.attrib.get("r", "")
            values[column_number(reference)] = cell_value(cell, shared_strings)
            if cell.find(f"{{{MAIN_NS}}}f") is not None:
                formulas += 1
        if values:
            width = max(values)
            rows.append([values.get(index) for index in range(1, width + 1)])
    return rows, formulas


def normalized(value) -> str:
    return re.sub(r"[^0-9a-z\u3131-\u318e\uac00-\ud7a3]+", "", str(value or "").lower())


def summarize_sheet(name: str, rows: list[list], formulas: int, include_rows: bool = False) -> dict:
    nonempty_rows = [row for row in rows if any(value not in (None, "") for value in row)]
    width = max((len(row) for row in nonempty_rows), default=0)
    header = nonempty_rows[0] if nonempty_rows else []
    body = nonempty_rows[1:]
    duplicate_full_rows = sum(
        count - 1
        for count in Counter(
            tuple(normalized(value) for value in row) for row in body
        ).values()
        if count > 1
    )
    summary = {
        "name": name,
        "nonemptyRows": len(nonempty_rows),
        "dataRowsAssumingFirstRowHeader": len(body),
        "maxColumns": width,
        "formulaCells": formulas,
        "header": header,
        "duplicateFullRows": duplicate_full_rows,
        "sampleRows": nonempty_rows[:6],
    }
    if include_rows:
        summary["rows"] = nonempty_rows
    return summary


def analyze(path: Path, include_rows: bool = False) -> dict:
    with zipfile.ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        sheets = []
        for sheet_name, sheet_path in sheet_targets(archive):
            rows, formulas = read_sheet(archive, sheet_path, shared_strings)
            sheets.append(summarize_sheet(sheet_name, rows, formulas, include_rows))
    return {
        "file": str(path.relative_to(ROOT)).replace("\\", "/"),
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
        "sheets": sheets,
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    include_rows = "--include-rows" in sys.argv[1:]
    unknown_arguments = [argument for argument in sys.argv[1:] if argument != "--include-rows"]
    if unknown_arguments:
        print(json.dumps({"error": "Unknown arguments", "arguments": unknown_arguments}))
        return 1
    missing = [str(path) for path in SOURCE_FILES if not path.is_file()]
    if missing:
        print(json.dumps({"error": "Missing source workbooks", "files": missing}, ensure_ascii=False))
        return 1
    report = {
        "mode": "READ_ONLY_SOURCE_AUDIT",
        "workbooks": [analyze(path, include_rows) for path in SOURCE_FILES],
    }
    json.dump(report, sys.stdout, ensure_ascii=False, indent=2)
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
