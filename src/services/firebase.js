import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2S3YvkzdgFFFOiaXXzLwXb1137qvDz3Q",
  authDomain: "las-engenharia.firebaseapp.com",
  projectId: "las-engenharia",
  storageBucket: "las-engenharia.appspot.com",
  messagingSenderId: "25444520412",
  appId: "1:25444520412:web:2d7df4d713ae4c61dd3f19",
  measurementId: "G-LCFPP4D7DN"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
