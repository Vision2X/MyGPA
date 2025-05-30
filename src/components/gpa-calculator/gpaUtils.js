export const gradePointMapSL = {
  'A+': 4.00, 'A': 4.00, 'A-': 3.70,
  'B+': 3.30, 'B': 3.00, 'B-': 2.70,
  'C+': 2.30, 'C': 2.00, 'C-': 1.70,
  'D+': 1.30, 'D': 1.00,
  'E': 0.00, 'F': 0.00,
};

export const getGpaClass = (gpa) => {
  if (gpa === null || gpa === undefined) return "N/A";
  const numericGpa = parseFloat(gpa);
  if (isNaN(numericGpa)) return "N/A";

  if (numericGpa >= 3.70) return "First Class";
  if (numericGpa >= 3.30) return "Second Class (Upper Division)";
  if (numericGpa >= 3.00) return "Second Class (Lower Division)";
  if (numericGpa >= 2.00) return "Pass";
  return "Fail";
};

export const calculateGpa = (modules) => {
  if (!modules || modules.length === 0) return { gpa: null, totalCredits: 0 };
  
  let totalQualityPoints = 0;
  let totalCredits = 0;

  modules.forEach(mod => {
    const credits = parseFloat(mod.credits);
    const gradePoints = gradePointMapSL[mod.grade] ?? null; // Use null if grade not in map

    if (!isNaN(credits) && credits > 0 && gradePoints !== null) {
        totalQualityPoints += gradePoints * credits;
        totalCredits += credits;
    } else if (!isNaN(credits) && credits > 0 && mod.grade === '') { 
      // Module exists but no grade yet, still counts towards attempted if you want
      // For now, only graded modules contribute to GPA calculation
    }
  });

  const gpa = totalCredits > 0 ? parseFloat((totalQualityPoints / totalCredits).toFixed(2)) : null;
  return { gpa, totalCredits };
};