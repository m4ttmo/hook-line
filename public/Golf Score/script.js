var score = 0;
var scoreTally = [0];
var holCount = 0;

let plus = document.querySelector(".plus");
let minus = document.querySelector(".minus");
let prev = document.querySelector(".prev");
let nxt = document.querySelector(".nxt");
let don = document.querySelector(".done");
document.getElementById("Finalscore").style.visibility = "hidden";

document.getElementById("score").innerHTML = scoreTally[holCount];
document.getElementById("holenum").innerHTML = holCount + 1;

nxt.addEventListener("click", () => {
  if (scoreTally[holCount + 1] == null) {
    holCount++;
    scoreTally[holCount] = 0;
  } else {
    holCount++;
  }
  document.getElementById("score").innerHTML = scoreTally[holCount];
  console.log("Hole:", holCount, " ", "Score:", scoreTally[holCount]);
  document.getElementById("holenum").innerHTML = holCount + 1;
});
plus.addEventListener("click", () => {
  scoreTally[holCount]++;

  document.getElementById("score").innerHTML = scoreTally[holCount];
  console.log("Hole:", holCount, " ", "Score:", scoreTally[holCount]);
});
minus.addEventListener("click", () => {
  scoreTally[holCount]--;
  document.getElementById("score").innerHTML = scoreTally[holCount];
  console.log("Hole:", holCount, " ", "Score:", scoreTally[holCount]);
});
prev.addEventListener("click", () => {
  if (holCount === 0) {
    scoreTally[0];
  } else {
    holCount--;
    scoreTally[holCount];
    document.getElementById("score").innerHTML = scoreTally[holCount];
    document.getElementById("holenum").innerHTML = holCount + 1;
  }
  console.log("Hole:", holCount, " ", "Score:", scoreTally[holCount]);
});
don.addEventListener("click", () => {
  for (let i = 0; i < scoreTally.length; i++) {
    score += scoreTally[i];
  }

  document.getElementById("Finalscore").style.visibility = "visible";
  document.getElementById("h1But").style.display = "none";
  document.getElementById("Finalscore").innerHTML = score;
});
