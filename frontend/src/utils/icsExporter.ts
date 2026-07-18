import type { Enrollment } from "@/types/api";

import { COURSE_SCHEDULES } from "@/data/courseSchedules";

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
