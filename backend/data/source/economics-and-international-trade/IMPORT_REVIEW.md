# Economics and International Trade source review

Reviewed on 2026-08-20. The original workbooks are preserved unchanged and
their SHA-256 hashes are pinned in the importer.

## Destination mapping

| Workbook data | Production major | Current rows | Existing matches | New rows |
| --- | --- | ---: | ---: | ---: |
| Trade | `68` International Trade | 43 | 22 | 21 |
| Tourism and Convention (2026) | `70` Tourism and Convention | 43 | 14 | 29 |
| Global Studies | `71` International Studies | 50 | 1 | 49 |

The source workbook IDs are not used because they do not match production
major IDs. Course identities are resolved within the destination major using
official course number when available, then normalized course name.

## Additional reviewed data

- Tourism contains 85 curriculum mappings across 2021 and 2026. Both years are
  retained in `course_curriculum`; the 2026 rows define the current catalog.
- The department website workbook contains 15 official PNU website mappings.
- Global Studies legacy five-digit codes are converted to the current PNU
  seven-digit representation before matching.
- `FOUNDATION` and `BASIC` are mapped to the existing database category
  `REQUIRED`; `ELECTIVE` remains `ELECTIVE`.
- The only category change to an existing course is course `4367` (`상법`),
  from `ELECTIVE` to reviewed `REQUIRED`.

## Preserved unknowns

Trade has no official course numbers, and the workbooks do not provide course
descriptions, prerequisites, recommended year, or grade-semester placement.
Those values remain null rather than being inferred.

## Safety gate

The reviewed application package contains 136 current courses, 85 Tourism
curriculum rows, and 15 department websites. Its checksum is:

`0387a775a97c87393da41c46810f63ca26e029691c53f3af0435d83f697013c3`

The database migration requires the exact checksum and the reviewed production
baseline (1,924 total courses; major counts 22, 14, and 1). Any mismatch aborts
the transaction.
