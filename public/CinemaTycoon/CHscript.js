var modal = document.getElementById("MovieInfoModal");
var screenMod = document.getElementById("ScreenSetModal");
var btn = document.getElementsByClassName("movieOption");
var span = document.getElementsByClassName("close")[0];
var MovID = [
  { id: "tt1517268", cost: 100000 },
  { id: "tt15398776", cost: 200000 },
  { id: "tt10160976", cost: 300000 },
  { id: "tt13957560", cost: 400000 },
  { id: "tt3291150", cost: 500000 },
];
var Mov = [];
var scrNum;
var scrOpt = [];
var MyCinLineUp = [];
var budget = 1000000;
var Filmcost;
var displayBudget = document.getElementById("budget");
var select = document.getElementById("selectNumber");

window.onload = function FilmLoad() {
  displayBudget.innerHTML = budget;
  for (let i = 0; i <= MovID.length; i++) {
    console.log(i);
    console.log(MovID[i].cost);
    fetch("https://www.omdbapi.com/?i=" + MovID[i].id + "&apikey=991caacb")
      .then((response) => response.json())
      .then((data) => {
        x = data.Title;
        if (data.Response == "False") {
          console.log("No movies were found - try again");
        } else {
          Mov[i] = data;
          document.getElementById("img" + i).src = data.Poster;
        }
      })
      .catch((err) => console.log(err));
  }
  console.log(Mov);
};

function MovieModal(i) {
  modal.style.display = "block";
  let synop = Mov[i].Plot;
  let poster = Mov[i].Poster;
  let cast = Mov[i].Actors;
  document.getElementById("Posterimg").src = poster;
  document.getElementById("synop").innerHTML = synop;
  document.getElementById("cast").innerHTML = cast;
}
function PickScreen(x) {
  if (typeof scrOpt[x] === "undefined") {
    screenMod.style.display = "block";
    movieSelect(x);
  } else {
    scrNum = x;
    document.getElementById("Scimg" + scrNum).src = "";
    budget = budget + Filmcost;
    scrOpt.splice(x, 1);
    displayBudget.innerHTML = budget;
    console.log(scrOpt + " " + x);
  }
}
span.onclick = function () {
  modal.style.display = "none";
  //screenMod.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal || event.target == screenMod) {
    modal.style.display = "none";
    screenMod.style.display = "none";
  }
};

function movieSelect(x) {
  select.innerHTML = "";
  for (var i = 0; i < Mov.length; i++) {
    select.innerHTML +=
      "<option value=" + Mov[i].imdbID + ">" + Mov[i].Title + "</option>";
  }
  scrNum = x;
}
function scrPick() {
  if (budget <= 0) {
    alert("your broke");
  } else {
    console.log("here");
    scrOpt[scrNum] = select.value;
    var index = Mov.map(function (e) {
      return e.imdbID;
    }).indexOf(scrOpt[scrNum]);
    let poster = Mov[index].Poster;
    document.getElementById("Scimg" + scrNum).src = poster;
    screenMod.style.display = "none";
    console.log(scrOpt);
    var indexCost = MovID.map(function (e) {
      return e.cost;
    }).indexOf(scrOpt[scrNum]);
    Filmcost = MovID[index].cost;
    console.log(Filmcost);
    budget = budget - Filmcost;
    displayBudget.innerHTML = budget;
  }
}
