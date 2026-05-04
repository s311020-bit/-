const bgm = document.getElementById("bgm");
const gameContainer = document.getElementById("game-container");

let score = 0;
let combo = 0;

const notes = [
  { time: 1000, lane: 0 },
  { time: 1500, lane: 1 },
  { time: 2000, lane: 2 }
];

function spawnNote(note){
  const el = document.createElement("div");
  el.className = "note";
  el.style.top = "0px";

  const lane = document.querySelectorAll(".lane")[note.lane];
  lane.appendChild(el);

  note.element = el;
}

function startGame(){
  bgm.play();

  notes.forEach(note=>{
    setTimeout(()=>spawnNote(note), note.time);
  });
}

window.addEventListener("keydown",e=>{
  console.log("Pressed:",e.key);
});

startGame();
