var modal = document.getElementById("MovieInfoModal");
var screenMod = document.getElementById("ScreenSetModal");
var btn = document.getElementsByClassName("movieOption");
var span = document.getElementsByClassName("close")[0];
var MovID = [
  { id: "tt1517268", cost: 500000 },
  { id: "tt15398776", cost: 500000 },
  { id: "tt10160976", cost: 500000 },
  { id: "tt13957560", cost: 500000 },
  { id: "tt3291150", cost: 500000 },
];
var Mov = [];
var scrNum;
var scrOpt = [];
var MyCinLineUp = [];
var budget = 1000000;
var displayBudget = document.getElementById("budget");

window.onload = function FilmLoad() {
  displayBudget.innerHTML = budget;
  for (let i = 0; i <= MovID.length; i++) {
    console.log(i);
    //console.log(MovID[i].id);
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
  screenMod.style.display = "block";
  movieSelect(x);
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

var select = document.getElementById("selectNumber");

function movieSelect(x) {
  select.innerHTML = "";
  for (var i = 0; i < Mov.length; i++) {
    select.innerHTML +=
      "<option value=" + Mov[i].imdbID + ">" + Mov[i].Title + "</option>";
  }
  scrNum = x;
}
function scrPick() {
  scrOpt[scrNum] = select.value;
  var index = Mov.map(function (e) {
    return e.imdbID;
  }).indexOf(scrOpt[scrNum]);
  let poster = Mov[index].Poster;
  document.getElementById("Scimg" + scrNum).src = poster;
  screenMod.style.display = "none";
  console.log(scrOpt);
}
