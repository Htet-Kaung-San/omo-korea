/**
 * The notice alert, and the reason it is a digest.
 *
 * The scraper pulls five PNU boards every fifteen minutes and the university
 * posts on the order of tens of notices a day. One push per notice would mean
 * a phone buzzing through a lecture and the student switching notifications off
 * within a day — which leaves them worse informed than before the feature
 * existed. A digest cannot spam by construction: one alert per sync run
 * regardless of how many notices arrived, and none when nothing did.
 */
jest.mock('../services/pushNotificationService', () => ({
  isPushConfigured: jest.fn(() => true),
  sendToStudent: jest.fn(async () => ({ sent: 1, removed: 0, failed: 0 })),
}));

const pushService = require('../services/pushNotificationService');
const { pushNoticeDigest, buildPayload } = require('../services/noticeDigestPush');

const subscribersFor = (ids) => ({
  from: () => ({ select: () => Promise.resolve({ data: ids.map((student_id) => ({ student_id })), error: null }) }),
});

const notice = (title) => ({ title });

beforeEach(() => {
  jest.clearAllMocks();
  pushService.isPushConfigured.mockReturnValue(true);
  pushService.sendToStudent.mockResolvedValue({ sent: 1, removed: 0, failed: 0 });
});

describe('one alert per run, never one per notice', () => {
  test('twelve new notices produce exactly one push per subscriber', async () => {
    const notices = Array.from({ length: 12 }, (_, i) => notice(`공지 ${i}`));

    const result = await pushNoticeDigest(subscribersFor([1, 2]), notices);

    expect(pushService.sendToStudent).toHaveBeenCalledTimes(2); // once per student
    expect(result.recipients).toBe(2);
    expect(result.notices).toBe(12);
  });

  test('nothing new sends nothing at all', async () => {
    const result = await pushNoticeDigest(subscribersFor([1, 2]), []);

    expect(pushService.sendToStudent).not.toHaveBeenCalled();
    expect(result.reason).toBe('nothing new');
  });

  test('a student with several devices is counted once as a recipient', async () => {
    // push_subscription holds one row per browser; the same student appears
    // multiple times and must not receive several digests.
    const result = await pushNoticeDigest(subscribersFor([7, 7, 7]), [notice('공지')]);

    expect(pushService.sendToStudent).toHaveBeenCalledTimes(1);
    expect(result.recipients).toBe(1);
  });

  test('no subscribers means no work', async () => {
    const result = await pushNoticeDigest(subscribersFor([]), [notice('공지')]);

    expect(pushService.sendToStudent).not.toHaveBeenCalled();
    expect(result.reason).toBe('no subscribers');
  });

  test('an unconfigured server does not pretend to have sent anything', async () => {
    pushService.isPushConfigured.mockReturnValue(false);

    const result = await pushNoticeDigest(subscribersFor([1]), [notice('공지')]);

    expect(result.skipped).toBe('push not configured');
    expect(pushService.sendToStudent).not.toHaveBeenCalled();
  });

  test('one student failing does not stop the rest', async () => {
    pushService.sendToStudent
      .mockRejectedValueOnce(new Error('push service unreachable'))
      .mockResolvedValue({ sent: 1, removed: 0, failed: 0 });

    const result = await pushNoticeDigest(subscribersFor([1, 2, 3]), [notice('공지')]);

    expect(pushService.sendToStudent).toHaveBeenCalledTimes(3);
    expect(result.failed).toBe(1);
    expect(result.sent).toBe(2);
  });
});

describe('what the notification says', () => {
  test('a single notice shows its own title', () => {
    const payload = buildPayload([notice('2026 Summer 반도체 설계캠프 모집 안내')]);

    expect(payload.title).toBe('PNU 새 공지');
    expect(payload.body).toContain('반도체 설계캠프');
    expect(payload.url).toBe('/notifications');
  });

  test('several notices name the newest and count the rest', () => {
    const payload = buildPayload([notice('첫 번째 공지'), notice('두 번째'), notice('세 번째')]);

    expect(payload.title).toContain('3건');
    expect(payload.body).toContain('첫 번째 공지');
    expect(payload.body).toContain('외 2건');
  });

  test('a long title is trimmed so the notification is not truncated mid-word by the OS', () => {
    const payload = buildPayload([notice('가'.repeat(300))]);

    expect(payload.body.length).toBeLessThanOrEqual(80);
  });

  test('every digest shares one tag, so a second replaces the first', () => {
    // Otherwise a student who was away for a day returns to a stack of alerts.
    expect(buildPayload([notice('a')]).tag).toBe(buildPayload([notice('b'), notice('c')]).tag);
  });
});
