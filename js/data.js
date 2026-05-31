// ========================================
// נתוני הקורס - הבעה במחשב
// אוניברסיטת חיפה
// ========================================

// מספר השיעור הנוכחי (עדכן כל שבוע)
const CURRENT_LESSON = 1;

// סה"כ מספר שיעורים בקורס
const TOTAL_LESSONS = 12;

// קוד נוכחות לשיעור הנוכחי (שנה כל שבוע כדי למנוע רישום מזויף)
// הסטודנטים יצטרכו להכניס את הקוד הזה בעמוד הנוכחות
const ATTENDANCE_CODE = "שיעור1";

// קבוצה 1 - שמות סטודנטים ונוכחות
// attendance: מערך של מספרי שיעורים שהסטודנט נכח בהם
const GROUP_1 = [
  { name: "סטודנט 1", attendance: [] },
  { name: "סטודנט 2", attendance: [] },
  { name: "סטודנט 3", attendance: [] },
  { name: "סטודנט 4", attendance: [] },
  { name: "סטודנט 5", attendance: [] },
  { name: "סטודנט 6", attendance: [] },
  { name: "סטודנט 7", attendance: [] },
  { name: "סטודנט 8", attendance: [] },
  { name: "סטודנט 9", attendance: [] },
  { name: "סטודנט 10", attendance: [] },
  { name: "סטודנט 11", attendance: [] },
  { name: "סטודנט 12", attendance: [] },
  { name: "סטודנט 13", attendance: [] },
  { name: "סטודנט 14", attendance: [] },
  { name: "סטודנט 15", attendance: [] },
  { name: "סטודנט 16", attendance: [] },
  { name: "סטודנט 17", attendance: [] },
  { name: "סטודנט 18", attendance: [] },
  { name: "סטודנט 19", attendance: [] },
  { name: "סטודנט 20", attendance: [] },
  { name: "סטודנט 21", attendance: [] },
  { name: "סטודנט 22", attendance: [] },
  { name: "סטודנט 23", attendance: [] },
  { name: "סטודנט 24", attendance: [] },
];

// קבוצה 2 - שמות סטודנטים ונוכחות
const GROUP_2 = [
  { name: "סטודנט 1", attendance: [] },
  { name: "סטודנט 2", attendance: [] },
  { name: "סטודנט 3", attendance: [] },
  { name: "סטודנט 4", attendance: [] },
  { name: "סטודנט 5", attendance: [] },
  { name: "סטודנט 6", attendance: [] },
  { name: "סטודנט 7", attendance: [] },
  { name: "סטודנט 8", attendance: [] },
  { name: "סטודנט 9", attendance: [] },
  { name: "סטודנט 10", attendance: [] },
  { name: "סטודנט 11", attendance: [] },
  { name: "סטודנט 12", attendance: [] },
  { name: "סטודנט 13", attendance: [] },
  { name: "סטודנט 14", attendance: [] },
  { name: "סטודנט 15", attendance: [] },
  { name: "סטודנט 16", attendance: [] },
  { name: "סטודנט 17", attendance: [] },
  { name: "סטודנט 18", attendance: [] },
  { name: "סטודנט 19", attendance: [] },
  { name: "סטודנט 20", attendance: [] },
  { name: "סטודנט 21", attendance: [] },
  { name: "סטודנט 22", attendance: [] },
  { name: "סטודנט 23", attendance: [] },
  { name: "סטודנט 24", attendance: [] },
];

// ========================================
// פונקציות עזר
// ========================================

function getStudentAttendanceCount(student, group) {
  const base = student.attendance ? [...student.attendance] : [];
  if (typeof localStorage !== 'undefined' && group) {
    const historyKey = `attendance_history_${group}_${student.name}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const merged = new Set([...base, ...history]);
    return merged.size;
  }
  return base.length;
}

function getAttendancePercentage(student, group) {
  if (CURRENT_LESSON === 0) return 0;
  return (getStudentAttendanceCount(student, group) / CURRENT_LESSON) * 100;
}

function getAllStudents(group) {
  if (group === 1) return GROUP_1;
  if (group === 2) return GROUP_2;
  return [...GROUP_1, ...GROUP_2];
}

function findStudent(name, group) {
  const students = getAllStudents(group);
  return students.find(s => s.name === name);
}

function getStudentNames(group) {
  return getAllStudents(group).map(s => s.name);
}
