const PRIORITY_SCORES = {
  HIGH: 35,
  NORMAL: 20,
  LOW: 10,
};

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getMatches(studentValues, noticeValues) {
  const studentSet = new Set(
    normalizeArray(studentValues).map(normalizeValue).filter(Boolean)
  );

  return normalizeArray(noticeValues).filter((value) =>
    studentSet.has(normalizeValue(value))
  );
}

function matchesOptionalList(studentValue, allowedValues) {
  const values = normalizeArray(allowedValues);

  if (values.length === 0) {
    return true;
  }

  return values.map(normalizeValue).includes(normalizeValue(studentValue));
}

function passesYearEligibility(studentYear, minYear, maxYear) {
  const year = Number(studentYear);
  const minimum = Number(minYear);
  const maximum = Number(maxYear);

  const hasMinimum = Number.isFinite(minimum);
  const hasMaximum = Number.isFinite(maximum);

  if (!hasMinimum && !hasMaximum) {
    return true;
  }

  if (!Number.isFinite(year)) {
    return false;
  }

  if (hasMinimum && year < minimum) {
    return false;
  }

  if (hasMaximum && year > maximum) {
    return false;
  }

  return true;
}

function parseDate(value) {
  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDeadlineInfo(deadline, asOfDate) {
  const deadlineDate = parseDate(deadline);
  const currentDate = parseDate(asOfDate);

  if (!deadlineDate || !currentDate) {
    return {
      daysRemaining: null,
      status: 'unknown',
      urgencyScore: 0,
    };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil(
    (deadlineDate.getTime() - currentDate.getTime()) / dayMs
  );

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      status: 'expired',
      urgencyScore: 0,
    };
  }

  if (daysRemaining <= 7) {
    return {
      daysRemaining,
      status: 'urgent',
      urgencyScore: 20,
    };
  }

  if (daysRemaining <= 30) {
    return {
      daysRemaining,
      status: 'upcoming',
      urgencyScore: 10,
    };
  }

  return {
    daysRemaining,
    status: 'future',
    urgencyScore: 0,
  };
}

function passesEligibility(studentProfile, notice) {
  const targetMajors = notice.targetMajors || notice.target_majors || [];
  const targetNationalities = notice.targetNationalities || notice.target_nationalities || [];
  const minYear = notice.minYear ?? notice.min_year;
  const maxYear = notice.maxYear ?? notice.max_year;

  return (
    matchesOptionalList(studentProfile.major, targetMajors) &&
    matchesOptionalList(
      studentProfile.nationality,
      targetNationalities
    ) &&
    passesYearEligibility(studentProfile.year, minYear, maxYear)
  );
}

function buildMatchHint({
  majorMatch,
  nationalityMatch,
  interestMatches,
  languageMatches,
  deadlineInfo,
}) {
  const hints = [];

  if (majorMatch) hints.push('Relevant to your major');
  if (nationalityMatch) hints.push('Relevant to your nationality');

  if (interestMatches.length > 0) {
    hints.push(`Matches interests: ${interestMatches.slice(0, 2).join(', ')}`);
  }

  if (languageMatches.length > 0) {
    hints.push(`Available in your language: ${languageMatches[0]}`);
  }

  if (deadlineInfo.status === 'urgent') {
    hints.push(`Deadline in ${deadlineInfo.daysRemaining} day(s)`);
  } else if (deadlineInfo.status === 'upcoming') {
    hints.push(`Deadline in ${deadlineInfo.daysRemaining} day(s)`);
  }

  return hints.join('; ');
}

function scoreNotice(studentProfile, notice, asOfDate) {
  const targetMajors = normalizeArray(notice.targetMajors || notice.target_majors || []);
  const targetNationalities = normalizeArray(notice.targetNationalities || notice.target_nationalities || []);

  const majorMatch =
    targetMajors.length > 0 &&
    targetMajors
      .map(normalizeValue)
      .includes(normalizeValue(studentProfile.major));

  const nationalityMatch =
    targetNationalities.length > 0 &&
    targetNationalities
      .map(normalizeValue)
      .includes(normalizeValue(studentProfile.nationality));

  const interestMatches = getMatches(studentProfile.interests, notice.tags || []);
  const languageMatches = getMatches(studentProfile.languages, notice.languages || []);
  const deadlineInfo = getDeadlineInfo(notice.deadline, asOfDate);

  const priority = String(notice.priority || 'NORMAL').trim().toUpperCase();

  let score = PRIORITY_SCORES[priority] ?? PRIORITY_SCORES.NORMAL;

  if (majorMatch) score += 20;
  if (nationalityMatch) score += 15;
  score += Math.min(interestMatches.length, 2) * 10;
  if (languageMatches.length > 0) score += 10;
  score += deadlineInfo.urgencyScore;

  return {
    score: Math.min(score, 100),
    deadlineInfo,
    matchHint: buildMatchHint({
      majorMatch,
      nationalityMatch,
      interestMatches,
      languageMatches,
      deadlineInfo,
    }),
  };
}

function compareNotices(a, b) {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  const aDeadline = String(a.deadline || '9999-12-31');
  const bDeadline = String(b.deadline || '9999-12-31');

  const deadlineDifference = aDeadline.localeCompare(bDeadline);

  if (deadlineDifference !== 0) {
    return deadlineDifference;
  }

  return String(a.title || '').localeCompare(String(b.title || ''));
}

function recommendNotices(studentProfile = {}, notices = [], options = {}) {
  const normalizedNotices = normalizeArray(notices);

  const excludedIds = new Set(
    normalizeArray(options.excludeNoticeIds).map((id) => String(id))
  );

  const limit =
    Number.isInteger(options.limit) && options.limit > 0
      ? options.limit
      : normalizedNotices.length;

  const asOfDate =
    typeof options.asOfDate === 'string'
      ? options.asOfDate
      : new Date().toISOString().slice(0, 10);

  return normalizedNotices
    .filter((notice) => !excludedIds.has(String(notice.id)))
    .filter((notice) => passesEligibility(studentProfile, notice))
    .map((notice) => ({
      ...notice,
      ...scoreNotice(studentProfile, notice, asOfDate),
    }))
    .filter(
      (notice) =>
        notice.score > 0 && notice.deadlineInfo.status !== 'expired'
    )
    .sort(compareNotices)
    .slice(0, limit);
}

module.exports = {
  recommendNotices,
};