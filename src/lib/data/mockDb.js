import { organization, assessments, risks, controls, documents, reports, questions } from '../../data/seed';
// Replace this in-memory store with PostgreSQL/Supabase repositories later.
export const db = { organization, assessments, risks, controls, documents, reports, questions, answers: [] };
