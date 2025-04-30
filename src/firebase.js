import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = { apiKey: "AIzaSyD2S3YvkzdgFFFOiaXXzLwXb1137qvDz3Q",
  authDomain: "las-engenharia.firebaseapp.com",
  projectId: "las-engenharia",
  storageBucket: "las-engenharia.firebasestorage.app",
  messagingSenderId: "25444520412",
  appId: "1:25444520412:web:2d7df4d713ae4c61dd3f19",
  measurementId: "G-LCFPP4D7DN" };

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);                          // ✅ Aqui está o `auth` exportado corretamente
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

export { db, auth, provider, storage };             // ✅ Exporta o `auth`
