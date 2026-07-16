# One-Stop (onestop.pusan.ac.kr) How-To Guide — Accordion Content Draft
 
Each block = one accordion item. Deep links follow the confirmed pattern
`https://onestop.pusan.ac.kr/page?menuCD=XXXXXXXXXXXX` — these require login first;
users will be redirected to `/login`, then bounced to the target page.
 
---
 
## 1. Course Registration (수강신청)
 
**Steps:**
1. Log in at [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) with your student ID and password.
2. Go to **수업 (Classes)** → **수강신청및확인 (Registration & Confirmation)**.
3. Check the course catalog first: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — search by department, browse open sections, check seat limits.
4. During the registration window, actual submission happens on the separate registration system: **[sugang.pusan.ac.kr](https://sugang.pusan.ac.kr)** (PC or mobile web). This is a different site from One-Stop — don't be confused if you're redirected here.
5. After submitting, go back to One-Stop → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) to confirm your courses were actually registered — do this every time, since "wishlist" (희망과목담기) does not equal a confirmed registration.
**Related pages:**
- [Course Add/Drop (수강신청및수강정정)](https://onestop.pusan.ac.kr/page?menuCD=000000000000044)
- [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)
- [Timetable View (시간표조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000366)
**Note:** Registration only opens during specific windows set by the academic calendar (typically listed on the One-Stop homepage). Check dates in advance — the system is only usable during these windows.
 
---

## 2. Course Cancellation / Withdrawal (수강취소)
 
**Steps:**
1. Log in at onestop.pusan.ac.kr.
2. Go to **수업 (Classes)** → **수강취소 (Course Cancellation)**: [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)
3. Select the course(s) you want to cancel and confirm.
4. Afterward, recheck [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) to confirm the course no longer appears on your active schedule.
**Note:** This is different from **수강정정 (add/drop)**, which happens early in the semester with no record left behind. 수강취소 opens later in the semester (typically a short window after midterms) and leaves a **W (Withdrawal)** mark on your transcript rather than removing the course entirely — so it's worth warning users this isn't a clean undo. Exact dates are set each semester on the academic calendar, so link this section to your notices/calendar feature too.

---
 
## 3. Checking Grades (성적확인)
 
**Steps:**
1. Log in at onestop.pusan.ac.kr.
2. Go to **수업 (Classes)** → grades section.
3. For the current semester: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)
4. For your full academic record: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)
**Note:** Current-semester grades are usually only visible after final grade postings close — if it looks empty, grades may not be released yet.
 
---
 
## 4. Tuition — Bill & Payment Confirmation (등록금 고지서 / 납부확인)
 
**Steps:**
1. Log in at onestop.pusan.ac.kr.
2. Go to **등록 (Registration/Tuition)** menu.
3. Print/view your bill: **고지서출력 (Bill Print)**.
4. Note your school payment code shown on the bill (varies by bank — NH, Busan Bank, Hana, etc.) and pay via bank transfer, ATM, internet/phone banking, or in-person at the bank.
5. Confirm payment went through: **납부확인 (Payment Confirmation / Receipt Print)** — check this after paying, since payment doesn't always reflect instantly.
**Note:** Tuition bills can't be requested by phone/email/fax on your behalf — you must access this yourself under your own login.
 
---
 
## 5. Leave of Absence / Return to School (휴학 / 복학 신청)
 
**Steps:**
1. Log in at onestop.pusan.ac.kr.
2. To apply for a leave of absence: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)
3. To apply to return from leave: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)
**Note:** Both have specific application windows each semester (check the academic calendar on the One-Stop homepage) — applying outside the window may not be possible.
 
---

## Implementation notes
 
- **Deep links behind login:** every link above lands on `/login` first if the user isn't authenticated, then should redirect to the target page. Worth testing this redirect behavior manually — some Korean university portals drop the redirect target after login and just dump users on the dashboard, in which case you'd want to add "then navigate to: 수업 → ..." as a fallback breadcrumb instead of relying purely on the deep link.
- **Academic calendar coupling:** registration, leave/return, and tuition windows are all date-gated. Pulling live dates from the 학사일정 (academic calendar) block on the One-Stop homepage into your notices/AI-summary feature and cross-linking to these guides would tie your existing MVP features together nicely.