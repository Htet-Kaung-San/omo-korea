import openpyxl, collections, json, sys

XLSX = "2. 2026학년도 1학기 학부 개설강좌 일람표(26.1.28.기준).xlsx"

# Korean 주관학과명 -> major_id in the `major` table. Only confident matches.
DEPT2MAJOR = {
    "경영학과":3, "국어국문학과":4, "기계공학부":5,
    "일어일문학과":10, "불어불문학과":12, "노어노문학과":13, "한문학과":14,
    "중어중문학과":15, "영어영문학과":16, "독어독문학과":17, "사학과":18,
    "철학과":19, "고고학과":20, "언어정보학과":21, "행정학과":22,
    "사회복지학과":23, "정치외교학과":25, "사회학과":26, "심리학과":27,
    "문헌정보학과":28, "미디어커뮤니케이션학과":29, "수학과":30, "통계학과":31,
    "미생물학과":32, "생명과학과":33, "대기환경과학과":34, "물리학과":35,
    "화학과":36, "분자생물학과":37, "지질환경과학과":38, "해양학과":39,
    "에너지시스템전공":40, "기계시스템설계전공":41, "제어자동화시스템전공":43,
    "원자력시스템전공":44, "지능형제조시스템전공":45, "항공우주공학과":46,
    "고분자공학과":47, "화공생명공학과":48, "환경공학과":49, "환경공학전공":49,
    "조선·해양공학과":50, "재료공학부":51, "산업공학과":52,
    "유기소재시스템공학과":54,
    "독어교육과":55, "국어교육과":56, "영어교육과":57, "불어교육과":58,
    "유아교육과":59, "일반사회교육과":60, "교육학과":61, "특수교육과":62,
    "역사교육과":63, "지리교육과":64, "윤리교육과":65, "물리교육과":66,
    "생물교육과":67, "체육교육과":68, "수학교육과":69, "화학교육과":70,
    "지구과학교육과":71, "의학과":73, "의예과":74,
    "성악전공":75, "피아노전공":76, "작곡전공":77, "관현악전공":78,
    "가구목조형전공":79, "도예전공":80, "섬유금속전공":81, "한국무용전공":82,
    "발레전공":83, "현대무용전공":84, "예술문화영상학과":85, "조소전공":86,
    "한국화전공":87, "서양화전공":88, "현악.성악전공":89, "관악.타악전공":90,
    "이론.작곡전공":91, "시각디자인전공":92, "애니메이션전공":93,
    "식물생명과학과":98, "동물생명자원과학과":99, "생명환경화학과":100,
    "바이오환경에너지학과":101, "조경학과":102, "원예생명과학과":103,
    "식품공학과":104, "바이오소재과학과":105, "바이오산업기계공학과":106,
    "IT응용공학과":107, "간호학과":108, "무역학부":109, "관광컨벤션학과":110,
    "공공정책학부":111, "경제학부":112, "아동가족학과":113, "식품영양학과":114,
    "스포츠과학과":115, "의류학과":116, "실내환경디자인학과":117,
    "디자인앤테크놀로지전공":118, "디자인테크놀로지전공":118,
    "의생명공학전공":119, "데이터사이언스전공":121, "첨단바이오공학전공":122,
    "인공지능전공":7, "컴퓨터공학전공":8, "전기공학전공":2,
}
# (college, dept) overrides for names that collide across colleges
COLLEGE_OVERRIDE = {
    ("학부대학","미래에너지전공"):124,
    ("학부대학","나노소자첨단제조전공"):125,
    ("학부대학","광메카트로닉스공학전공"):126,
}
# Majors already populated with better (bilingual) data -> don't touch
SKIP_MAJORS = {2, 7, 8}
MAJOR_CATS = {"전공필수":"REQUIRED", "전공기초":"REQUIRED", "전공선택":"ELECTIVE"}

wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb["개설강좌일람표"]

seen = set()                      # (major_id, name) dedupe
per_major = collections.defaultdict(lambda: collections.Counter())
courses = []
unmapped = collections.Counter()

for r in ws.iter_rows(min_row=8, values_only=True):
    college, dept, name, cat, credit = r[1], r[3], r[7], r[8], r[9]
    if cat not in MAJOR_CATS or not dept or not name:
        continue
    mid = COLLEGE_OVERRIDE.get((college, dept)) or DEPT2MAJOR.get(dept)
    if not mid:
        unmapped[f"[{college}] {dept}"] += 1
        continue
    if mid in SKIP_MAJORS:
        continue
    key = (mid, name.strip())
    if key in seen:
        continue
    seen.add(key)
    try: cr = int(credit)
    except: cr = 0
    if cr < 1:            # DB course_credit_check requires credit >= 1;
        continue          # skips 0-credit edge cases (졸업논문, integrated blocks)
    category = MAJOR_CATS[cat]
    courses.append({"major_id":mid, "course_name":name.strip(), "credit":cr, "category":category})
    per_major[mid][category] += 1

json.dump(courses, open("/private/tmp/claude-501/-Users-sam-Projects-omo-korea/44314706-ecbe-4492-8793-c7504068eecb/scratchpad/courses.json","w"), ensure_ascii=False, indent=1)

print(f"COURSES TO INSERT: {len(courses)}  across {len(per_major)} majors\n")
print(f"UNMAPPED departments: {len(unmapped)}  ({sum(unmapped.values())} course-rows skipped)")
for d,n in unmapped.most_common():
    print(f"   {n:4d}  {d}")
