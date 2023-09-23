function BoxOfficeFetch() {
  fetch("https://api.trakt.tv/movies/boxoffice")
    .then((response) => response.json())
    .then((data) => {
      if (data.Response == "False") {
        console.log("error");
      } else {
        console.log(data);
      }
    })
    .catch((err) => console.log(err));
}
