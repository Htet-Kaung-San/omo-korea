const webpush = require("web-push");

/**
 * Web-push delivery.
 *
 * The keys are a VAPID pair. The public half is compiled into the browser
 * bundle so the client can subscribe; the private half signs the requests and
 * must stay on the server. Losing the pair invalidates every stored
 * subscription at once, because a subscription is bound to the key that
 * created it — so rotate it only deliberately.
 */
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:swedu@pusan.ac.kr";

let configured = false;
if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
}

const isPushConfigured = () => configured;

/** A push service saying the subscription is gone for good, not a transient error. */
const GONE_STATUS = new Set([404, 410]);

/**
 * Sends one notification to every browser a student has registered.
 *
 * Subscriptions that the push service reports as gone are deleted here rather
 * than retried. A browser that was uninstalled or had its permission revoked
 * answers 410 forever, and keeping it means every future send wastes a request
 * and logs an error that looks like a real fault.
 *
 * @returns {{sent: number, removed: number, failed: number}}
 */
async function sendToStudent(supabaseClient, studentId, payload) {
  if (!configured) return { sent: 0, removed: 0, failed: 0, skipped: "push not configured" };

  const { data: subscriptions, error } = await supabaseClient
    .from("push_subscription")
    .select("id, endpoint, p256dh, auth")
    .eq("student_id", studentId);
  if (error) throw new Error(`Failed to read push subscriptions: ${error.message}`);
  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, removed: 0, failed: 0 };
  }

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        body,
        // Push services drop anything they cannot deliver within the TTL.
        // A campus notice is not worth waking a phone about days later.
        { TTL: 60 * 60 * 12 },
      );
      sent += 1;
    } catch (err) {
      if (GONE_STATUS.has(err.statusCode)) {
        await supabaseClient.from("push_subscription").delete().eq("id", subscription.id);
        removed += 1;
      } else {
        failed += 1;
        console.error(
          `Push failed for subscription ${subscription.id} (status ${err.statusCode ?? "?"}): ${err.message}`,
        );
      }
    }
  }

  if (sent > 0) {
    await supabaseClient
      .from("push_subscription")
      .update({ last_used_at: new Date().toISOString() })
      .eq("student_id", studentId);
  }

  return { sent, removed, failed };
}

module.exports = { isPushConfigured, sendToStudent, PUBLIC_KEY };
