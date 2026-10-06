ALTER TABLE classroom_member ADD COLUMN student_code VARCHAR(8);
CREATE UNIQUE INDEX uq_classroom_member_student_code ON classroom_member(student_code);
