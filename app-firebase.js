// app-firebase.js
// ✅ Firebase v9 모듈러 (CDN) — 단일 import로 정리
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, doc, setDoc, where, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ===========================
   1) Firebase 초기화
=========================== */
const firebaseConfig = {
  apiKey: "AIzaSyBBqPXQ2gdvV28kg9CA9iG_-vtvAwVUEhQ",
  authDomain: "fir-project-840ce.firebaseapp.com",
  projectId: "fir-project-840ce",
  storageBucket: "fir-project-840ce.firebasestorage.app",
  messagingSenderId: "888263266605",
  appId: "1:888263266605:web:ddf3482537f15ca868c3a4",
  measurementId: "G-XYMWK0RWGF"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ===========================
   2) Create / Read
=========================== */
// 단건 추가 (자동 문서ID)
export async function addRecord(data) {
  await addDoc(collection(db, "records"), data);
  console.log("✅ addRecord:", data);
}

// 전체 조회
export async function getAllRecords() {
  const snap = await getDocs(collection(db, "records"));
  return snap.docs.map(d => d.data());
}

// 날짜 오름차순 정렬 조회
export async function getAllRecordsOrdered() {
  const q = query(collection(db, "records"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

/* ===========================
   3) Aggregation Helpers
=========================== */
// 최근 7일 합계
export async function getWeeklyTotal() {
  const all = await getAllRecordsOrdered();
  const since = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10);
  const recent = all.filter(r => (r.date || "") >= since);
  const total = recent.reduce((acc, r) =>
    acc + (r.tumbler||0) + (r.lightOff||0) + (r.zeroWaste||0), 0);
  return { since, days: 7, total };
}

/* ===========================
   4) Upsert (중복 저장 방지)
=========================== */
// 날짜+반 조합을 문서ID로 사용하여 upsert
export async function upsertRecordByKey(record) {
  const { date, class: cls } = record;
  if (!date || !cls) throw new Error("date와 class는 필수입니다.");
  const id = `${date}_${cls}`; // 예: 2025-10-11_2-1
  await setDoc(doc(db, "records", id), record, { merge: true });
  console.log("✅ upsertRecordByKey:", id, record);
  return id;
}

/* ===========================
   5) 조건부 조회 (범위/반필터)
=========================== */
/**
 * getRecordsByRangeAndClass
 * @param {{ startDate?: string, endDate?: string, cls?: string }} opts
 *  - startDate / endDate: "YYYY-MM-DD"
 *  - cls: "2-1" 등. 생략 또는 "ALL"이면 전체
 */
export async function getRecordsByRangeAndClass(opts = {}) {
  const { startDate, endDate, cls } = opts;

  const clauses = [];
  if (startDate) clauses.push(where("date", ">=", startDate));
  if (endDate)   clauses.push(where("date", "<=", endDate));
  if (cls && cls !== "ALL") clauses.push(where("class", "==", cls));

  const qy = clauses.length
    ? query(collection(db, "records"), ...clauses, orderBy("date", "asc"))
    : query(collection(db, "records"), orderBy("date", "asc"));

  // 🔎 주의: where("class","==",X) + orderBy("date") 조합은
  //    Firestore에서 "복합 인덱스" 생성 링크가 뜰 수 있음 → 한 번 생성해주면 됨.
  const snap = await getDocs(qy);
  return snap.docs.map(d => d.data());
}

/* ===========================
   6) 삭제 유틸
=========================== */
// 전체 records 삭제
export async function deleteAllRecords() {
  const snap = await getDocs(collection(db, "records"));
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "records", d.id))));
  console.log("🗑 모든 기록 삭제 완료");
}

// 특정 반 데이터만 삭제
export async function deleteRecordsByClass(cls) {
  if (!cls) throw new Error("삭제할 반(class)을 지정해야 합니다.");
  const snap = await getDocs(collection(db, "records"));
  const targets = snap.docs.filter(d => (d.data().class === cls));
  await Promise.all(targets.map(d => deleteDoc(doc(db, "records", d.id))));
  console.log(`🗑 ${cls} 반 데이터 삭제 완료 (건수: ${targets.length})`);
}

console.log("[app-firebase.js] loaded ✅");
