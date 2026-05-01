export const riskLevelFromScore = (score) => (score <= 4 ? 'Low' : score <= 9 ? 'Medium' : score <= 15 ? 'High' : 'Critical');
export const calcRiskScore = (likelihood, impact) => Number(likelihood) * Number(impact);
export const overallAssessmentScore = (risks) => {
  if (!risks.length) return 0;
  const total = risks.reduce((sum, r) => sum + calcRiskScore(r.likelihood, r.impact), 0);
  return Math.round((total / (risks.length * 25)) * 100);
};
export const assessmentLevelFromOverall = (s) => (s <= 25 ? 'Low' : s <= 50 ? 'Medium' : s <= 75 ? 'High' : 'Critical');
