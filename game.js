const game = document.getElementById("game");
const lanes = document.querySelectorAll(".lane");

const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const accEl = document.getElementById("acc");

let score = 0;
let combo = 0;
let totalHit = 0;
let totalAccuracy = 0;

const noteSpeed = 4;

const chart = [
    {time:1000,lane:0},
    {time:1500,lane:1},
    {time:2000,lane:2},
    {time:2500,lane:3},
    {time:3000,lane:0},
    {time:3500,lane:1},
    {time:4000,lane:2},
    {time:4500,lane:3},
];

let startTime = null;
let spawned = 0;
let activeNotes = [];

function spawnNote(lane){
    const note = document.createElement("div");
    note.className = "note";
    note.style.top = "-20px";

    lanes[lane].appendChild(note);

    activeNotes.push({
        lane,
        el:note,
        y:-20
    });
}

function updateGame(timestamp){
    if(!startTime) startTime = timestamp;

    const currentTime = timestamp - startTime;

    while(
        spawned < chart.length &&
        currentTime >= chart[spawned].time - 2000
    ){
        spawnNote(chart[spawned].lane);
        spawned++;
    }

    activeNotes.forEach(note=>{
        note.y += noteSpeed;
        note.el.style.top = note.y + "px";
    });

    activeNotes = activeNotes.filter(note=>{
        if(note.y > 700){
            note.el.remove();
            combo = 0;
            updateHUD();
            return false;
        }
        return true;
    });

    requestAnimationFrame(updateGame);
}

function hitLane(lane){
    let target = null;
    let bestDiff = Infinity;

    activeNotes.forEach(note=>{
        if(note.lane !== lane) return;

        const diff = Math.abs(note.y - 580);

        if(diff < bestDiff){
            bestDiff = diff;
            target = note;
        }
    });

    if(!target) return;

    let acc = 0;

    if(bestDiff < 20){
        score += 300;
        combo++;
        acc = 100;
    }else if(bestDiff < 50){
        score += 100;
        combo++;
        acc = 70;
    }else if(bestDiff < 80){
        score += 50;
        combo = 0;
        acc = 40;
    }else{
        return;
    }

    totalHit++;
    totalAccuracy += acc;

    target.el.remove();
    activeNotes = activeNotes.filter(n=>n!==target);

    updateHUD();
}

function updateHUD(){
    scoreEl.textContent = score;
    comboEl.textContent = combo;

    const accuracy =
        totalHit === 0
        ? 100
        : totalAccuracy / totalHit;

    accEl.textContent = accuracy.toFixed(2) + "%";
}

window.addEventListener("keydown",e=>{
    const key = e.key.toLowerCase();

    if(key==="a") hitLane(0);
    if(key==="s") hitLane(1);
    if(key==="d") hitLane(2);
    if(key==="f") hitLane(3);
});

requestAnimationFrame(updateGame);
