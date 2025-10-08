firebase.html

// 추후 Firebase 연결 시 여기에 config 넣을 예정
// 예시:
/*
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_APP.firebaseapp.com",
  databaseURL: "https://YOUR_APP.firebaseio.com",
  projectId: "YOUR_APP",
  storageBucket: "YOUR_APP.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "XXXXXX"
};
firebase.initializeApp(firebaseConfig);
*/


// ✅ firebase.js (v9 모듈 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBqPXQ2gdvV28kg9CA9iG_-vtvAwVUEhQ",
  authDomain: "fir-project-840ce.firebaseapp.com",
  projectId: "fir-project-840ce",
  storageBucket: "fir-project-840ce.firebasestorage.app",
  messagingSenderId: "888263266605",
  appId: "1:888263266605:web:ddf3482537f15ca868c3a4",
  measurementId: "G-XYMWK0RWGF"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Firestore에 데이터 추가 함수
export async function addRecord(record) {
  await addDoc(collection(db, "records"), record);
}

// ✅ Firestore에서 데이터 불러오기 함수
export async function getAllRecords() {
  const snapshot = await getDocs(collection(db, "records"));
  return snapshot.docs.map(doc => doc.data());
}


