-- Prevent deleting a catalog course while a student timetable still refers to it.
-- Additive migration for databases where student_timetable.sql was already applied.
begin;

alter table public.student_timetable_entry
  drop constraint if exists student_timetable_entry_course_id_fkey;

alter table public.student_timetable_entry
  add constraint student_timetable_entry_course_id_fkey
  foreign key (course_id)
  references public.course(course_id)
  on delete restrict;

commit;
