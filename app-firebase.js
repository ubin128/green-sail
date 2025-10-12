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

// ✅ 날짜 범위 + 반 필터 조회
import { where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/**
 * 조건부 조회
 * @param {{ startDate?: string, endDate?: string, cls?: string }} opts
 *  - startDate/endDate: "YYYY-MM-DD" 문자열 (둘 다 선택)
 *  - cls: 반 이름 (예: "2-1"), 생략 또는 "ALL"이면 전체
 */
export async function getRecordsByRangeAndClass(opts = {}) {
  const { startDate, endDate, cls } = opts;

  // 기본 컬렉션
  let q = collection(db, "records");
  const clauses = [];

  // 날짜 범위 필터 (문자열 YYYY-MM-DD이므로 비교 가능)
  if (startDate) clauses.push(where("date", ">=", startDate));
  if (endDate)   clauses.push(where("date", "<=", endDate));

  // 반 필터
  if (cls && cls !== "ALL") clauses.push(where("class", "==", cls));

  // orderBy는 date로 (범위필터와 동일 필드)
  if (clauses.length > 0) {
    q = query(collection(db, "records"), ...clauses, orderBy("date", "asc"));
  } else {
    q = query(collection(db, "records"), orderBy("date", "asc"));
  }

  // 주의: class == X + orderBy(date) 조합은 "인덱스 생성"이 필요할 수 있음
  // 콘솔에 링크가 뜨면 눌러서 인덱스 한 번만 만들어주면 됩니다.
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}


console.log("[app-firebase.js] loaded ✅");

