var modal = document.getElementById("MovieInfoModal");
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
//var synop = document.getElementsByClassName("synop");
//var poster = document.getElementsByClassName("Poster");
//var cast = document.getElementsByClassName("cast");

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
          //document.getElementById("root").innerHTML = x;
          //document.querySelector("p").innerHTML = data.Plot;
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
span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
