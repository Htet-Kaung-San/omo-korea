import type { Enrollment } from "@/types/api";

interface TimeSlot {
  day: number; // 1: Mon, ..., 5: Fri
  start: string; // "09:00"
  end: string; // "10:30"
}

const COURSE_SCHEDULES: Record<number, TimeSlot[]> = {
  1: [
    { day: 1, start: "09:00", end: "10:30" },
    { day: 3, start: "09:00", end: "10:30" },
  ],
  2: [
    { day: 1, start: "10:30", end: "12:00" },
    { day: 3, start: "10:30", end: "12:00" },
  ],
  3: [
    { day: 2, start: "09:00", end: "10:30" },
    { day: 4, start: "09:00", end: "10:30" },
  ],
  4: [
    { day: 2, start: "10:30", end: "12:00" },
    { day: 4, start: "10:30", end: "12:00" },
  ],
  5: [
    { day: 1, start: "13:00", end: "14:30" },
    { day: 3, start: "13:00", end: "14:30" },
  ],
  6: [
    { day: 2, start: "13:00", end: "14:30" },
    { day: 4, start: "13:00", end: "14:30" },
  ],
  7: [
    { day: 1, start: "14:30", end: "16:00" },
    { day: 3, start: "14:30", end: "16:00" },
  ],
  8: [
    { day: 2, start: "14:30", end: "16:00" },
    { day: 4, start: "14:30", end: "16:00" },
  ],
  9: [{ day: 5, start: "09:00", end: "12:00" }],
  10: [{ day: 5, start: "13:00", end: "16:00" }],
  11: [{ day: 3, start: "16:00", end: "17:30" }],
  12: [{ day: 4, start: "16:00", end: "17:30" }],
};

export function generateIcsString(enrollments: Enrollment[]): string {
  if (enrollments.length === 0) return "";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hey PNU//Timetable Exporter//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  enrollments.forEach((enrollment) => {
    const courseId = Number(enrollment.course_id);
    const slots = COURSE_SCHEDULES[courseId] || [];

    slots.forEach((slot, index) => {
      // Mon = Sep 7, Tue = Sep 8, Wed = Sep 9, Thu = Sep 10, Fri = Sep 11, 2026
      const firstDayDateStr =
        slot.day <= 3 ? `2026090${6 + slot.day}` : `202609${6 + slot.day}`;

      const startClean = slot.start.replace(":", "");
      const endClean = slot.end.replace(":", "");

      const eventUid = `hey-pnu-class-${enrollment.enrollment_id}-${slot.day}-${index}@heypnu.com`;
      const timestamp = "20260907T090000Z"; // Consistent timestamp for testing

      icsContent.push("BEGIN:VEVENT");
      icsContent.push(`UID:${eventUid}`);
      icsContent.push(`DTSTAMP:${timestamp}`);
      icsContent.push(
        `DTSTART;TZID=Asia/Seoul:${firstDayDateStr}T${startClean}00`,
      );
      icsContent.push(`DTEND;TZID=Asia/Seoul:${firstDayDateStr}T${endClean}00`);
      icsContent.push("RRULE:FREQ=WEEKLY;UNTIL=20261225T180000Z"); // Semester ends December 25
      icsContent.push(`SUMMARY:${enrollment.course_name}`);
      icsContent.push(
        `DESCRIPTION:Enrolled Class: ${enrollment.course_name}\\nCredits: ${enrollment.credit} Credits\\nCategory: ${enrollment.category}\\nClassroom: ${enrollment.classroom || "Main Campus"}`,
      );
      icsContent.push(
        `LOCATION:${enrollment.classroom ? `${enrollment.classroom}, Pusan National University` : "Pusan National University Campus"}`,
      );
      icsContent.push("END:VEVENT");
    });
  });

  icsContent.push("END:VCALENDAR");
  return icsContent.join("\r\n");
}

export function exportTimetableToIcs(enrollments: Enrollment[]): void {
  const content = generateIcsString(enrollments);
  if (!content) return;

  const blob = new Blob([content], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "pnu_schedule.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
