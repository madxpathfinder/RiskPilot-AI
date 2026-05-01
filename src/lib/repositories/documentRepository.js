import { db } from '../data/mockDb';
export const listDocuments = () => db.documents;
export const addDocument = (doc) => { db.documents.unshift(doc); return doc; };
