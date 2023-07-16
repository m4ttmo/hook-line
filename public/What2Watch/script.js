var params = document.getElementById("button");
params.addEventListener("click", getParams);
var movieList = [];
var movieTitle = [];

function getParams() {
  movieList = [];
  var genre = document.getElementById("Genre").value;
  var certificate = document.getElementById("Certificate").value;
  var runt = document.getElementById("RunT").value;
  var relTyp = document.querySelector('input[name="reltyp"]:checked').value;
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();
  var relformat;

  today = yyyy + "-" + mm + "-" + dd;

  if (relTyp == "Theatrical") {
    relformat = "&primary_release_date.gte=";
  } else if (relTyp == "Home") {
    relformat = "&primary_release_date.lte=";
  }
  console.log(today);

  var url =
    "https://api.themoviedb.org/3/discover/movie?api_key=3d5de9bc75efc0818a12aaaf8f88f0b5&include_adult=false&include_video=false&page=1&with_genres=" +
    genre +
    "&certification_country=GB&certification=" +
    certificate +
    "&with_runtime.lte=" +
    runt +
    relformat +
    today;
  console.log(genre, certificate, runt, relTyp);

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      for (let i = 0; i < data.results.length; i++) {
        movieList.push(data.results[i]);
        movieTitle.push(data.results[i].original_title);
        console.log(movieList[i].original_title);
      }
      displayResults();
    })
    .catch((err) => console.log(err));
}
function displayResults() {
  if (movieList.length == 0) {
    alert("No Films Found");
    window.location.reload();
  }
  var number = Math.floor(Math.random() * movieList.length);

  console.log(number);
  document.getElementById("rescount").innerHTML =
    movieList.length + ":" + (number + 1);
  document.getElementById("title").innerHTML = movieList[number].original_title;

  var imgURL =
    "url(" +
    "https://image.tmdb.org/t/p/original" +
    movieList[number].poster_path +
    ")";
  document.getElementById("img").style.backgroundImage = imgURL;

  document.getElementById("blur").innerHTML = movieList[number].overview;
}
