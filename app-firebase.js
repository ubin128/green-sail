// ✅ Firebase 모듈 불러오기 (단일 import로 정리)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, doc, setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ✅ Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBBqPXQ2gdvV28kg9CA9iG_-vtvAwVUEhQ",
  authDomain: "fir-project-840ce.firebaseapp.com",
  projectId: "fir-project-840ce",
  storageBucket: "fir-project-840ce.firebasestorage.app",
  messagingSenderId: "888263266605",
  appId: "1:888263266605:web:ddf3482537f15ca868c3a4",
  measurementId: "G-XYMWK0RWGF"
};

// ✅ Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Firestore에 데이터 추가
export async function addRecord(data) {
  await addDoc(collection(db, "records"), data);
  console.log("✅ 데이터 추가 완료:", data);
}

// ✅ Firestore의 모든 데이터 가져오기
export async function getAllRecords() {
  const snapshot = await getDocs(collection(db, "records"));
  return snapshot.docs.map(doc => doc.data());
}

// ✅ 날짜순 정렬해서 가져오기
export async function getAllRecordsOrdered() {
  const q = query(collection(db, "records"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// ✅ 최근 7일간 합계 구하기
export async function getWeeklyTotal() {
  const all = await getAllRecordsOrdered();
  const since = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10);
  const recent = all.filter(r => (r.date||"") >= since);
  const sum = recent.reduce((acc, r) =>
    acc + (r.tumbler||0) + (r.lightOff||0) + (r.zeroWaste||0), 0);
  return { since, days: 7, total: sum };
}

// ✅ 날짜+반을 키로 사용하는 업서트 (중복 저장 방지)
export async function upsertRecordByKey(record) {
  const { date, class: cls } = record;
  if (!date || !cls) throw new Error("date와 class는 필수입니다.");
  const id = `${date}_${cls}`; // 예: 2025-10-11_2-1
  await setDoc(doc(db, "records", id), record, { merge: true });
  return id;
}

console.log("[app-firebase.js] loaded ✅");

