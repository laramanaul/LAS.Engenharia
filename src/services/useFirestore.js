import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export async function getAll(colecao) {
  const querySnapshot = await getDocs(collection(db, colecao));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addItem(colecao, data) {
  const docRef = await addDoc(collection(db, colecao), data);
  return docRef.id;
}

export async function deleteItem(colecao, id) {
  await deleteDoc(doc(db, colecao, id));
}

export async function updateItem(colecao, id, data) {
  await updateDoc(doc(db, colecao, id), data);
}
