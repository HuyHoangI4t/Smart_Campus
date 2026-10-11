import { GpaSummary } from "../types";

export const convertTo4Scale = (score10: number): number => {
  if (score10 >= 8.5) return 4.0;
  if (score10 >= 7.0) return 3.0;
  if (score10 >= 5.5) return 2.0;
  if (score10 >= 4.0) return 1.0;
  return 0.0;
};

export const getAcademicRank = (gpa4Value: number) => {
  if (gpa4Value >= 3.6) return { label: "Xuất sắc", color: "#10B981" };
  if (gpa4Value >= 3.2) return { label: "Giỏi", color: "#3B82F6" };
  if (gpa4Value >= 2.5) return { label: "Khá", color: "#F59E0B" };
  if (gpa4Value >= 2.0) return { label: "Trung bình", color: "#6B7280" };
  return { label: "Yếu", color: "#EF4444" };
};

export const parseGpaSummary = (gradeItems: any[]): GpaSummary | null => {
  if (!Array.isArray(gradeItems) || gradeItems.length === 0) return null;
  const graded = gradeItems.filter((item: any) => {
    const letter = (item.diem_chu || item.gradeLetter || "").toUpperCase();
    const score10 =
      item.diem_hp !== null && item.diem_hp !== undefined && !isNaN(Number(item.diem_hp))
        ? Number(item.diem_hp)
        : (item.grade10 ? Number(item.grade10) : 0);
    return letter !== "X" && letter !== "P" && score10 > 0;
  });

  const accumulated = gradeItems.filter((item: any) => {
    const letter = (item.diem_chu || item.gradeLetter || "").toUpperCase();
    const score10 =
      item.diem_hp !== null && item.diem_hp !== undefined && !isNaN(Number(item.diem_hp))
        ? Number(item.diem_hp)
        : (item.grade10 ? Number(item.grade10) : 0);
    return letter !== "X" && letter !== "F" && (letter || score10 > 0);
  });

  const totalCredits = accumulated.reduce(
    (acc, c) => acc + Number(c.so_tin_chi || c.credits || 0),
    0
  );
  const totalGradedCredits = graded.reduce(
    (acc, c) => acc + Number(c.so_tin_chi || c.credits || 0),
    0
  );

  if (totalGradedCredits === 0) return null;

  const sum10 = graded.reduce((acc, c) => {
    const score10 =
      c.diem_hp !== null && c.diem_hp !== undefined && !isNaN(Number(c.diem_hp))
        ? Number(c.diem_hp)
        : (c.grade10 ? Number(c.grade10) : 0);
    const cred = Number(c.so_tin_chi || c.credits || 0);
    return acc + score10 * cred;
  }, 0);

  const sum4 = graded.reduce((acc, c) => {
    const score10 =
      c.diem_hp !== null && c.diem_hp !== undefined && !isNaN(Number(c.diem_hp))
        ? Number(c.diem_hp)
        : (c.grade10 ? Number(c.grade10) : 0);
    const cred = Number(c.so_tin_chi || c.credits || 0);
    return acc + convertTo4Scale(score10) * cred;
  }, 0);

  const gpa10Val = (sum10 / totalGradedCredits).toFixed(2);
  const gpa4Val = (sum4 / totalGradedCredits).toFixed(2);
  const rankObj = getAcademicRank(Number(gpa4Val));

  return {
    gpa4: gpa4Val,
    gpa10: gpa10Val,
    totalCredits,
    rank: rankObj.label,
    rankColor: rankObj.color,
  };
};

