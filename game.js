const LANES = 4;
const SCROLL_TIME = 2000;

const JUDGE_WINDOWS = {
    perfect: 30,
    good: 70,
    bad: 120,
    miss: 180
};

let score = 0;
let combo = 0;
let audioOffsetMs = 0;
let totalNotesJudged = 0;
let accuracyScore = 0;
let gameRunning = false;

const bgm = document.getElementById("bgm");
const laneEls = [...document.querySelectorAll(".lane")];
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const accEl = document.getElementById("acc");
const characterEl = document.getElementById("game-character");

const chartData = [
    { id:1,lane:0,timeMs:1000 },
    { id:2,lane:1,timeMs:1500 },
    { id:3,lane:2,timeMs:2000 },
    { id:4,lane:3,timeMs:2500 },
    { id:5,lane:1,timeMs:3200,type:"hold",durationMs:1200 }
];

let notes = [];

function resetGame(){
    score = 0;
    combo = 0;
    totalNotesJudged = 0;
    accuracyScore = 0;

    notes = chartData.map(n=>({...n,spawned:false,hit:false}));

    document.querySelectorAll(".note").forEach(n=>n.remove());

    updateHUD();
}

function nowMs(){
    return bgm.currentTime*1000+audioOffsetMs;
}

function updateHUD(){
    scoreEl.textContent=score;
    comboEl.textContent=combo;
    accEl.textContent=getAccuracy().toFixed(2)+"%";
}

function getAccuracy(){
    if(totalNotesJudged===0) return 100;
    return accuracyScore/(totalNotesJudged*100)*100;
}

function judgeTiming(noteMs,hitMs){
    const diff=Math.abs(noteMs-hitMs);

    if(diff<=30) return "PERFECT";
    if(diff<=70) return "GOOD";
    if(diff<=120) return "BAD";
    return "MISS";
}

function applyJudge(result){
    totalNotesJudged++;

    const feedback=document.getElementById("hit-feedback");
    feedback.textContent=result;

    if(result==="PERFECT"){
        score+=100;
        combo++;
        accuracyScore+=100;
        animateCharacter("perfect");
    }
    else if(result==="GOOD"){
        score+=70;
        combo++;
        accuracyScore+=70;
        animateCharacter("good");
    }
    else if(result==="BAD"){
        score+=30;
        combo=0;
        accuracyScore+=30;
        animateCharacter("bad");
    }
    else{
        combo=0;
        animateCharacter("miss");
    }

    updateHUD();
}

function animateCharacter(type){
    const map={
        perfect:"assets/character/perfect.png",
        good:"assets/character/good.png",
        bad:"assets/character/bad.png",
        miss:"assets/character/miss.png"
    };

    characterEl.src=map[type];

    setTimeout(()=>{
        characterEl.src="assets/character/idle.png";
    },250);
}

function spawnNote(note){
    const el=document.createElement("div");
    el.className="note";
    el.id="note-"+note.id;

    if(note.type==="hold"){
        el.classList.add("hold");
        el.style.height=`${note.durationMs/2}px`;
    }

    laneEls[note.lane].appendChild(el);
    note.spawned=true;
}

function update(){
    if(!gameRunning) return;

    const current=nowMs();

    for(const note of notes){

        if(!note.spawned && current>=note.timeMs-SCROLL_TIME){
            spawnNote(note);
        }

        const el=document.getElementById("note-"+note.id);

        if(el && !note.hit){
            const progress=(current-(note.timeMs-SCROLL_TIME))/SCROLL_TIME;
            el.style.top=`${progress*600}px`;
        }

        if(!note.hit && current>note.timeMs+JUDGE_WINDOWS.miss){
            note.hit=true;
            el?.remove();
            applyJudge("MISS");
        }
    }

    requestAnimationFrame(update);
}

function hitLane(lane){
    const current=nowMs();

    let target=null;
    let bestDiff=999999;

    for(const note of notes){
        if(note.hit || note.lane!==lane) continue;

        const diff=Math.abs(note.timeMs-current);

        if(diff<bestDiff){
            bestDiff=diff;
            target=note;
        }
    }

    if(!target || bestDiff>JUDGE_WINDOWS.miss) return;

    target.hit=true;

    document.getElementById("note-"+target.id)?.remove();

    applyJudge(judgeTiming(target.timeMs,current));
}

window.addEventListener("keydown",e=>{
    const map={
        d:0,
        f:1,
        j:2,
        k:3
    };

    const lane=map[e.key.toLowerCase()];

    if(lane!==undefined){
        hitLane(lane);
    }
});

window.startGame=function(){
    if(gameRunning) return;

    resetGame();

    gameRunning=true;

    bgm.currentTime=0;
    bgm.play();

    update();
}
