let notes = [];
let score = 0;
let combo = 0;
let bgm = new Audio();

function update(){}
function spawnNote(){}
function onMiss(){}
function updateHUD(){}
/************************************************
 * PIXEL RHYTHM - COMMERCIAL CORE
 ************************************************/

// ===============================
// CONFIG
// ===============================
const LANES = 4;
const SCROLL_TIME = 2000;

const JUDGE_WINDOWS = {
  perfect: 30,
  good: 70,
  bad: 120,
  miss: 180
};

// ===============================
// GAME STATE
// ===============================
let score = 0;
let combo = 0;

let audioOffsetMs = 0;

let notes = [];
let activeHolds = new Map();

let totalNotesJudged = 0;
let accuracyScore = 0;
let timingOffsets = [];

let replayLog = [];
let calibrationSamples = [];

let currentScrollSpeed = 1;

// ===============================
// ELEMENTS
// ===============================
const bgm = document.getElementById("bgm");
const laneEls = [...document.querySelectorAll(".lane")];

const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");

// ===============================
// DEMO CHART
// ===============================
notes = [
  { id: 1, lane: 0, timeMs: 1000 },
  { id: 2, lane: 1, timeMs: 1500 },
  { id: 3, lane: 2, timeMs: 2000 },
  { id: 4, lane: 3, timeMs: 2500 },
  { id: 5, lane: 1, timeMs: 3200, type: "hold", durationMs: 1200 }
];

// ===============================
// TIME
// ===============================
function nowMs() {
  return bgm.currentTime * 1000 + audioOffsetMs;
}

// ===============================
// HUD
// ===============================
function updateHUD() {
  scoreEl.textContent = score;
  comboEl.textContent = combo;
}

// ===============================
// JUDGE
// ===============================
function judgeTiming(noteMs, hitMs) {
  const diff = Math.abs(noteMs - hitMs);

  if (diff <= JUDGE_WINDOWS.perfect) return "PERFECT";
  if (diff <= JUDGE_WINDOWS.good) return "GOOD";
  if (diff <= JUDGE_WINDOWS.bad) return "BAD";
  return "MISS";
}

function applyJudge(result, offsetMs = 0) {
  totalNotesJudged++;
  timingOffsets.push(offsetMs);

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

    default:
      onMiss();
      return;
  }

  updateHUD();
  updateAccuracyUI();
}

// ===============================
// MISS
// ===============================
function onMiss() {
  combo = 0;
  updateHUD();
}

// ===============================
// HIT
// ===============================
function hitLane(lane) {
  const current = nowMs();

  let target = null;
  let bestDiff = Infinity;

  for (const note of notes) {
    if (note.hit) continue;
    if (note.lane !== lane) continue;

    const diff = Math.abs(note.timeMs - current);

    if (diff < bestDiff) {
      bestDiff = diff;
      target = note;
    }
  }

  if (!target || bestDiff > JUDGE_WINDOWS.miss) {
    onMiss();
    return;
  }

  if (target.type === "hold") {
    startHold(target);
    return;
  }

  target.hit = true;

  document.getElementById("note-" + target.id)?.remove();

  applyJudge(
    judgeTiming(target.timeMs, current),
    current - target.timeMs
  );
}

// ===============================
// HOLD NOTE
// ===============================
function startHold(note) {
  const current = nowMs();

  const result = judgeTiming(note.timeMs, current);

  if (result === "MISS") {
    onMiss();
    return;
  }

  note.hit = true;

  activeHolds.set(note.lane, {
    note,
    endTime: note.timeMs + note.durationMs
  });

  const el = document.getElementById("note-" + note.id);

  if (el) el.style.opacity = "0.5";

  applyJudge(result, current - note.timeMs);
}

function releaseHold(lane) {
  const hold = activeHolds.get(lane);

  if (!hold) return;

  const diff = Math.abs(nowMs() - hold.endTime);

  if (diff <= JUDGE_WINDOWS.good) {
    score += 300;
    combo++;
  } else {
    onMiss();
  }

  document.getElementById("note-" + hold.note.id)?.remove();

  activeHolds.delete(lane);

  updateHUD();
}

function updateHoldSystem() {
  const current = nowMs();

  for (const [lane, hold] of activeHolds) {
    if (current > hold.endTime + JUDGE_WINDOWS.miss) {
      document.getElementById("note-" + hold.note.id)?.remove();

      activeHolds.delete(lane);

      onMiss();
    }
  }
}

// ===============================
// SPAWN NOTE
// ===============================
function spawnNote(note) {
  const el = document.createElement("div");

  el.className = "note";
  el.id = "note-" + note.id;

  if (note.type === "hold") {
    el.classList.add("hold");
    el.style.height = `${note.durationMs / 4}px`;
  }

  laneEls[note.lane].appendChild(el);

  note.spawned = true;
}

// ===============================
// UPDATE LOOP
// ===============================
function update() {
  const current = nowMs();

  for (const note of notes) {
    if (!note.spawned && current >= note.timeMs - SCROLL_TIME) {
      spawnNote(note);
    }

    if (!note.hit && current > note.timeMs + JUDGE_WINDOWS.miss) {
      note.hit = true;
      document.getElementById("note-" + note.id)?.remove();
      onMiss();
    }
  }

  updateHoldSystem();

  requestAnimationFrame(update);
}

// ===============================
// ACCURACY UI
// ===============================
function getAccuracy() {
  if (!totalNotesJudged) return 100;

  return (
    accuracyScore /
    (totalNotesJudged * 100)
  ) * 100;
}

function getRank() {
  const acc = getAccuracy();

  if (acc >= 99.5) return "SSS";
  if (acc >= 98) return "SS";
  if (acc >= 95) return "S";
  if (acc >= 90) return "A";
  if (acc >= 80) return "B";
  if (acc >= 70) return "C";

  return "D";
}

function updateAccuracyUI() {
  let el = document.getElementById("accuracy");

  if (!el) {
    el = document.createElement("div");
    el.id = "accuracy";

    document.body.appendChild(el);
  }

  el.textContent =
    `ACC ${getAccuracy().toFixed(2)}% | ${getRank()}`;
}

// ===============================
// RESULT
// ===============================
function showResultScreen() {
  const panel = document.createElement("div");

  panel.innerHTML = `
    <div class="result-panel">
      <h1>RESULT</h1>
      <p>Score: ${score}</p>
      <p>Accuracy: ${getAccuracy().toFixed(2)}%</p>
      <p>Rank: ${getRank()}</p>
      <button onclick="location.reload()">Restart</button>
    </div>
  `;

  document.body.appendChild(panel);
}

// ===============================
// INPUT
// ===============================
window.addEventListener("keydown", e => {
  const map = {
    a: 0,
    w: 1,
    s: 2,
    d: 3
  };

  const lane = map[e.key.toLowerCase()];

  if (lane !== undefined) {
    replayLog.push({
      lane,
      timeMs: nowMs()
    });

    hitLane(lane);
  }
});

window.addEventListener("keyup", e => {
  const map = {
    a: 0,
    w: 1,
    s: 2,
    d: 3
  };

  const lane = map[e.key.toLowerCase()];

  if (lane !== undefined) {
    releaseHold(lane);
  }
});

// ===============================
// START
// ===============================
bgm.addEventListener("ended", showResultScreen);

window.startGame = function () {
  bgm.play();
  update();
};
