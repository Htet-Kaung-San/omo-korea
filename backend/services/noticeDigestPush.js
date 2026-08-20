const { isPushConfigured, sendToStudent } = require("./pushNotificationService");

/**
 * Sends one "new notices" alert per sync run, not one per notice.
 *
 * The scraper pulls five boards every fifteen minutes and PNU posts on the
 * order of tens of notices a day. A push per notice would mean a phone buzzing
 * through a lecture, and the student turning notifications off within a day —
 * which is worse than never having shipped them.
 *
 * A digest cannot spam by construction: however many notices arrive in one
 * run, the student gets exactly one alert, and none at all when nothing new
 * landed. It also degrades honestly — the notification names the newest notice
 * and says how many others came with it, so it is useful without pretending to
 * be personalised ranking the data cannot support.
 */
const MAX_TITLE_LENGTH = 80;

function buildPayload(newNotices) {
  const newest = newNotices[0];
  const others = newNotices.length - 1;
  const title = String(newest?.title ?? "").slice(0, MAX_TITLE_LENGTH);

  return {
    title: others > 0 ? `PNU 새 공지 ${newNotices.length}건` : "PNU 새 공지",
    body: others > 0 ? `${title} 외 ${others}건` : title,
    url: "/notifications",
    // One tag for the whole feature: a second digest replaces the first rather
    // than stacking, so a student who was away does not return to a wall.
    tag: "heypnu-notices",
  };
}

/**
 * @param {object} supabaseClient
 * @param {Array<{title?: string}>} newNotices  Notices inserted by this run.
 */
async function pushNoticeDigest(supabaseClient, newNotices) {
  if (!isPushConfigured()) return { skipped: "push not configured" };
  if (!Array.isArray(newNotices) || newNotices.length === 0) {
    return { recipients: 0, sent: 0, reason: "nothing new" };
  }

  // Only students who actually enabled it. Selecting distinct student_id from
  // the subscription table rather than iterating all students keeps this
  // proportional to the people who opted in.
  const { data: rows, error } = await supabaseClient
    .from("push_subscription")
    .select("student_id");
  if (error) throw new Error(`Failed to read push subscribers: ${error.message}`);

  const studentIds = [...new Set((rows || []).map((row) => row.student_id))];
  if (studentIds.length === 0) return { recipients: 0, sent: 0, reason: "no subscribers" };

  const payload = buildPayload(newNotices);
  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const studentId of studentIds) {
    try {
      const result = await sendToStudent(supabaseClient, studentId, payload);
      sent += result.sent;
      removed += result.removed;
      failed += result.failed;
    } catch (err) {
      failed += 1;
      console.error(`Notice digest push failed for student ${studentId}: ${err.message}`);
    }
  }

  return { recipients: studentIds.length, sent, removed, failed, notices: newNotices.length };
}

module.exports = { pushNoticeDigest, buildPayload };
