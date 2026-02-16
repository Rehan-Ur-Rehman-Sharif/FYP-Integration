import teacherData from "../data/TeacherData";

export function initTeachers() {
  const stored = localStorage.getItem("teachers");
  if (!stored) {
    localStorage.setItem("teachers", JSON.stringify(teacherData));
  }
}
