/************************************************
 * PIXEL RHYTHM - 優化版核心引擎
 ************************************************/

// ===============================
// 1. 設定參數 (CONFIG)
// ===============================
const LANES = 4;
const SCROLL_TIME = 2000; // 音符從出現到抵達判定線的時間 (ms)

const JUDGE_WINDOWS = {
    perfect: 30,
    good: 70,
    bad: 120,
    miss: 180
};

// ===============================
// 2. 遊戲狀態 (GAME STATE)
// ===============================
let score = 0;
let combo = 0;
let audioOffsetMs = 0;
let notes = [];
let activeHolds = new Map();
let totalNotesJudged = 0;
let accuracyScore = 0;
let gameRunning = false;

// ===============================
// 3. 取得 DOM 元素
// ===============================
// 確保 HTML 裡有一個 <audio id="bgm" src="..."></audio>
const bgm = document.getElementById("bgm") || new Audio(); 
const laneEls = [...document.querySelectorAll(".lane")];
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const accEl = document.getElementById("acc"); // 對應 HTML 的準確度顯示

// ===============================
// 4. 範例譜面 (DEMO CHART)
// ===============================
const chartData = [
    { id: 1, lane: 0, timeMs: 1000 },
    { id: 2, lane: 1, timeMs: 1500 },
    { id: 3, lane: 2, timeMs: 2000 },
    { id: 4, lane: 3, timeMs: 2500 },
    { id: 5, lane: 1, timeMs: 3200, type: "hold", durationMs: 1200 }
];
notes = chartData.map(n => ({ ...n, spawned: false, hit: false }));

// ===============================
// 5. 時間與更新邏輯
// ===============================
function nowMs() {
    return bgm.currentTime * 1000 + audioOffsetMs;
}

function updateHUD() {
    if (scoreEl) scoreEl.textContent = score;
    if (comboEl) comboEl.textContent = combo;
    if (accEl) accEl.textContent = `${getAccuracy().toFixed(2)}%`;
}

// 判定邏輯
function judgeTiming(noteMs, hitMs) {
    const diff = Math.abs(noteMs - hitMs);
    if (diff <= JUDGE_WINDOWS.perfect) return "PERFECT";
    if (diff <= JUDGE_WINDOWS.good) return "GOOD";
    if (diff <= JUDGE_WINDOWS.bad) return "BAD";
    return "MISS";
}

function applyJudge(result, offsetMs = 0) {
    totalNotesJudged++;
    const feedbackEl = document.getElementById("hit-feedback");
    if (feedbackEl) feedbackEl.textContent = result;

    switch (result) {
        case "PERFECT":
            score += 100;
            combo++;
            accuracyScore += 100;
            break;
        case "GOOD":
            score += 70;
            combo++;
            accuracyScore += 70;
            break;
        case "BAD":
            score += 30;
            combo = 0;
            accuracyScore += 30;
            break;
        default: // MISS
            onMiss();
            return;
    }
    updateHUD();
}

function onMiss() {
    combo = 0;
    totalNotesJudged++;
    // accuracyScore 不增加
    updateHUD();
    const feedbackEl = document.getElementById("hit-feedback");
    if (feedbackEl) feedbackEl.textContent = "MISS";
}

// ===============================
// 6. 音符生成與移動
// ===============================
function spawnNote(note) {
    const el = document.createElement("div");
    el.className = "note";
    el.id = "note-" + note.id;

    if (note.type === "hold") {
        el.classList.add("hold");
        // 簡單的高度計算 (根據時間長度)
        el.style.height = `${note.durationMs / 2}px`; 
    }

    laneEls[note.lane].appendChild(el);
    note.spawned = true;
}

function update() {
    if (!gameRunning) return;
    const current = nowMs();

    notes.forEach(note => {
        // 生成音符
        if (!note.spawned && current >= note.timeMs - SCROLL_TIME) {
            spawnNote(note);
        }

        // 音符向下移動邏輯 (CSS 控制或 JS 改變 top)
        const el = document.getElementById("note-" + note.id);
        if (el && !note.hit) {
            const elapsed = current - (note.timeMs - SCROLL_TIME);
            const progress = elapsed / SCROLL_TIME;
            el.style.top = `${progress * 100}%`; // 假設判定線在 100% 位置
        }

        // 漏接判定
        if (!note.hit && current > note.timeMs + JUDGE_WINDOWS.miss) {
            note.hit = true;
            if (el) el.remove();
            onMiss();
        }
    });

    requestAnimationFrame(update);
}

// ===============================
// 7. 輸入處理
// ===============================
function hitLane(lane) {
    const current = nowMs();
    let target = notes.find(n => !n.hit && n.lane === lane && Math.abs(n.timeMs - current) < JUDGE_WINDOWS.miss);

    if (!target) return;

    target.hit = true;
    const el = document.getElementById("note-" + target.id);
    if (el) el.remove();

    const result = judgeTiming(target.timeMs, current);
    applyJudge(result, current - target.timeMs);
}

function getAccuracy() {
    return totalNotesJudged === 0 ? 100 : (accuracyScore / (totalNotesJudged * 100)) * 100;
}

// 監聽鍵盤
window.addEventListener("keydown", e => {
    const keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
    const lane = keyMap[e.key.toLowerCase()];
    if (lane !== undefined) hitLane(lane);
});

// ===============================
// 8. 啟動遊戲
// ===============================
window.startGame = function() {
    if (gameRunning) return;
    score = 0;
    combo = 0;
    gameRunning = true;
    bgm.play().catch(e => console.error("音樂播放失敗，請檢查檔案路徑"));
    update();
};
