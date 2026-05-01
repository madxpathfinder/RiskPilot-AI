import { db } from '../data/mockDb';
import { calcRiskScore, riskLevelFromScore } from '../scoring';
export const listRisks = () => db.risks;
export const updateRisk = (id, patch) => {
  db.risks = db.risks.map((r) => {
    if (r.id !== id) return r;
    const likelihood = Number(patch.likelihood ?? r.likelihood);
    const impact = Number(patch.impact ?? r.impact);
    const score = calcRiskScore(likelihood, impact);
    return { ...r, ...patch, likelihood, impact, score, level: riskLevelFromScore(score) };
  });
  return db.risks.find((r) => r.id === id);
};
