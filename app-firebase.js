// app-firebase.js
// ✅ Firebase v9 모듈러 (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getFirestore, collection, getDocs,
    query, orderBy, doc, setDoc, where, deleteDoc, getDoc // Added getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ===========================
    1) Firebase 초기화 (기존과 동일)
=========================== */
const firebaseConfig = {
    // Keep your existing config here
    apiKey: "AIzaSyBBqPXQ2gdvV28kg9CA9iG_-vtvAwVUEhQ", // Replace with your actual key if needed, hide in production
    authDomain: "fir-project-840ce.firebaseapp.com",
    projectId: "fir-project-840ce",
    storageBucket: "fir-project-840ce.appspot.com",
    messagingSenderId: "888263266605",
    appId: "1:888263266605:web:ddf3482537f15ca868c3a4",
    measurementId: "G-XYMWK0RWGF"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const STUDENT_RECORDS_COLLECTION = "studentRecords"; // ✅ Collection for individual student records

/* ===========================
    2) Upsert 학생 기록 (log.html에서 사용) ✨ New Function
=========================== */
/**
 * 학생의 하루 기록을 저장하거나 업데이트 (덮어쓰기).
 * @param {object} record - log.html로부터 받은 데이터 객체
 * { class: "1-3", student: "1-3-15", date: "2025-10-21", checks: ["c_light", "c_food"], totalKg: 0.17 }
 */
export async function upsertStudentRecord(record) {
    const { date, student } = record;
    if (!date || !student) throw new Error("date와 student ID는 필수입니다.");

    const docId = `${date}_${student}`; // 예: "2025-10-21_1-3-15"

    // ⚠️ log.html의 중복된 c_food ID를 고유 ID로 변경해야 합니다!
    // 아래는 board.html 호환성 및 명확성을 위한 개별 항목 값 추가 예시입니다.
    // log.html의 실제 checkbox id에 맞게 'c_...' 부분을 수정하세요.
    const individualItems = {
        tumbler: record.checks.includes('c_tumbler') ? 1 : 0,
        lightOff: record.checks.includes('c_light') ? 1 : 0,
        plug: record.checks.includes('c_plug') ? 1 : 0,
        stairs: record.checks.includes('c_stairs') ? 1 : 0,
        transit: record.checks.includes('c_transit') ? 1 : 0,
        food: record.checks.includes('c_food_waste') ? 1 : 0, // 잔반 줄이기 ID 확인 필요
        // --- log.html에 추가된 항목들에 대한 ID 매핑 (ID를 반드시 고유하게 수정하세요!) ---
        water: record.checks.includes('c_water_off') ? 1 : 0, // 양치 물 잠그기 (ID: c_water 가정)
        recycle: record.checks.includes('c_recycle') ? 1 : 0, // 분리배출 (ID: c_recycle 가정)
        label: record.checks.includes('c_label_off') ? 1 : 0, // 라벨 제거 (ID: c_label 가정)
        plant: record.checks.includes('c_plant') ? 1 : 0, // 식물 가꾸기 (ID: c_plant 가정)
        ecoProduct: record.checks.includes('c_eco_product') ? 1 : 0, // 친환경 제품 (ID: c_ecoProduct 가정)
        reduceConsume: record.checks.includes('c_secondhand') ? 1 : 0, // 소비 줄이기 (ID: c_reduceConsume 가정)
        // -----------------------------------------------------------------------
        zeroWaste: 0 // board.html의 zeroWaste 항목 계산 로직 필요 (예: 특정 항목들의 합?)
                     // 우선 0으로 설정, 필요시 board.html 로직에 맞춰 수정
    };
    
    // 최종 저장할 데이터 (기본 정보 + 개별 항목 값)
    const dataToSave = {
        ...record,
        ...individualItems
    };

    try {
        await setDoc(doc(db, STUDENT_RECORDS_COLLECTION, docId), dataToSave, { merge: true });
        console.log("✅ upsertStudentRecord:", docId, dataToSave);
        return docId;
    } catch (error) {
        console.error("Error saving student record:", error);
        throw error; // 에러를 다시 던져서 호출한 곳에서 알 수 있게 함
    }
}


/* ===========================
    3) 학생 기록 조회 (log.html에서 사용) ✨ New Function
=========================== */
/**
 * 특정 학생의 기록들을 조회합니다. (날짜 오름차순)
 * @param {string} studentId - "학년-반-학번" (예: "1-3-15")
 * @param {string[]} [dates] - 선택 사항. 특정 날짜들의 기록만 가져올 경우 날짜 문자열 배열 전달
 */
export async function getStudentRecords(studentId, dates) {
    if (!studentId) return [];

    const clauses = [where("student", "==", studentId)];
    // dates 배열이 제공되면 해당 날짜들만 조회
    if (dates && dates.length > 0) {
        clauses.push(where("date", "in", dates));
    }

    const q = query(collection(db, STUDENT_RECORDS_COLLECTION), ...clauses, orderBy("date", "asc"));

    try {
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching student records:", error);
        return []; // 에러 발생 시 빈 배열 반환
    }
}


/* ===========================
    4) 조건부 조회 (board.html / index.html에서 사용) ✨ Modified
=========================== */
/**
 * 기간 및/또는 반으로 필터링하여 학생 기록 목록을 조회합니다.
 * @param {{ startDate?: string, endDate?: string, cls?: string }} opts
 */
export async function getRecordsByRangeAndClass(opts = {}) {
    const { startDate, endDate, cls } = opts;
    const clauses = [];
    if (startDate) clauses.push(where("date", ">=", startDate));
    if (endDate)   clauses.push(where("date", "<=", endDate));
    if (cls && cls !== "ALL") clauses.push(where("class", "==", cls));

    const qy = clauses.length
        ? query(collection(db, STUDENT_RECORDS_COLLECTION), ...clauses, orderBy("date", "asc"))
        : query(collection(db, STUDENT_RECORDS_COLLECTION), orderBy("date", "asc"));

    try {
        const snap = await getDocs(qy);
        // board.html이 필요한 tumbler, lightOff, zeroWaste 등을 포함하여 반환
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching records by range/class:", error);
        // 복합 인덱스 생성 필요 에러일 수 있음 (콘솔 확인)
        if (error.code === 'failed-precondition') {
             console.warn("Firestore 복합 인덱스가 필요할 수 있습니다. 콘솔의 링크를 클릭하여 생성해주세요.");
        }
        return [];
    }
}


/* ===========================
    5) 삭제 유틸 ✨ Modified
=========================== */
/*전체 학생 기록 삭제
export async function deleteAllRecords() {
    try {
        const snap = await getDocs(collection(db, STUDENT_RECORDS_COLLECTION));
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, STUDENT_RECORDS_COLLECTION, d.id))));
        console.log(`🗑 모든 ${STUDENT_RECORDS_COLLECTION} 기록 삭제 완료`);
    } catch (error) {
        console.error("Error deleting all records:", error);
    }
} */

/* 특정 반 학생 기록만 삭제
export async function deleteRecordsByClass(cls) {
    if (!cls) throw new Error("삭제할 반(class)을 지정해야 합니다.");
    try {
        const q = query(collection(db, STUDENT_RECORDS_COLLECTION), where("class", "==", cls));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, STUDENT_RECORDS_COLLECTION, d.id))));
        console.log(`🗑 ${cls} 반 데이터 삭제 완료 (건수: ${snap.docs.length})`);
    } catch (error) {
        console.error(`Error deleting records for class ${cls}:`, error);
    }
} */

// --- ✨ Delete Single Student Record (for log.html Reset button) ---
/**
 * Deletes a specific student record for a given date.
 * @param {string} date - "YYYY-MM-DD"
 * @param {string} studentId - "Grade-Class-Num"
 */
export async function deleteStudentRecord(date, studentId) { // ✅ export 키워드와 함수 이름 확인!
    if (!date || !studentId) throw new Error("date and student ID are required for deletion.");
    const docId = `${date}_${studentId}`;
    try {
        await deleteDoc(doc(db, STUDENT_RECORDS_COLLECTION, docId));
        console.log(`🗑 deleteStudentRecord: ${docId}`);
        return true;
    } catch (error) {
        console.error(`Error deleting record ${docId}:`, error);
        return false;
    }
}

console.log("[app-firebase.js] updated for student records structure ✅");