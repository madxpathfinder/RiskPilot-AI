export const canEdit = (role) => role === 'Admin' || role === 'Risk Manager';
export const canReview = (role) => role === 'Auditor' || canEdit(role);
