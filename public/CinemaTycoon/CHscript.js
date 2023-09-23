var modal = document.getElementById("MovieInfoModal");
var screenMod = document.getElementById("ScreenSetModal");
var btn = document.getElementsByClassName("movieOption");
var span = document.getElementsByClassName("close")[0];
var MovID = [
  "tt1517268",
  "tt15398776",
  "tt10160976",
  "tt13957560",
  "tt3291150",
];
var Mov = [];
//var titleOpt = [];
var scrNum;
var scrOpt = [];
var MyCinLineUp = [];
var budget = 1000000;

window.onload = function FilmLoad() {
  for (let i = 0; i <= MovID.length; i++) {
    console.log(i);
    fetch("http://www.omdbapi.com/?i=" + MovID[i] + "&apikey=991caacb")
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
    //titleOpt[i] = Mov[i];
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
