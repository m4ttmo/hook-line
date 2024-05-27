const apiKey = "3d5de9bc75efc0818a12aaaf8f88f0b5";
var movieId;
var movieRev;
var mTotal = [];
var mattMov = [];
var boxOfficeChart;

var LMovies = [];
var MTotals = [
  {
    name: "Godzilla X Kong",
    data: [],
    id: 823464,
    special: "Matt",
  },
  {
    name: "Furiosa",
    data: [],
    id: 786892,
    special: "Matt",
  },
  {
    name: "Commondants Shadow",
    data: [],
    id: 1277783,
    special: "Matt",
  },
  {
    name: "Twisters",
    data: [],
    id: 718821,
    special: "Matt",
  },
  {
    name: "Horizon: An American Saga Chapter 1",
    data: [],
    id: 932086,
    special: "Matt",
  },
  {
    name: "Horizon: An American Saga Chapter 2",
    data: [],
    id: 1120368,
    special: "Matt",
  },
  {
    name: "Blink Twice",
    data: [],
    id: 840705,
    special: "Matt",
  },
  {
    name: "Super/Man: The Christopher Reeve Story",
    data: [],
    id: 1128559,
    special: "Matt",
  },
  {
    name: "Lord Of The Rings: War Of The Rohirrim",
    data: [],
    id: 839033,
    special: "Matt",
  },
  {
    name: "Dune: Part 2",
    data: [],
    id: 693134,
    special: "Lisa",
  },
  {
    name: "Challengers",
    data: [],
    id: 937287,
    special: "Lisa",
  },
  {
    name: "The Watchers",
    data: [],
    id: 1086747,
    special: "Lisa",
  },
  {
    name: "Trap",
    data: [],
    id: 1032823,
    special: "Lisa",
  },
  {
    name: "Beatlejuice Beetlejuice",
    data: [],
    id: 889737,
    special: "Lisa",
  },
  {
    name: "Joker: Foil a duex",
    data: [],
    id: 917496,
    special: "Lisa",
  },
];
var LTotals = [];

const revPull = async () => {
  let data = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
  )
    .then((response) => response.json())
    .then((data) => {
      movieRev = data;
      objIndex = MTotals.findIndex((obj) => obj.id == movieId);
      if (MTotals[objIndex].special == "Matt") {
        MTotals[objIndex].data.push(movieRev.revenue, 0);
      } else {
        MTotals[objIndex].data.push(0, movieRev.revenue);
      }
      console.log(MTotals);
      mTotal = { ...MTotals };
    })

    .catch((error) => console.log("Error fetching data:", error));
};

const secondFunction = async () => {
  const result = await sort();

  drawChart();
};
const loops = async () => {
  for (let i = 0; i < MTotals.length; i++) {
    movieId = MTotals[i].id;
    await revPull();
  }
};

const sort = async () => {
  const result = await loops();
};

secondFunction();

function drawChart() {
  let xArray = [];
  console.log(mTotal[1]);
  for (i = 0; i < Object.keys(mTotal).length; i++) {
    xArray.push(mTotal[i]);
  }
  console.log(Array.isArray(xArray));
  console.log(Array.isArray(mTotal));
  var options = {
    chart: {
      type: "bar",
      stacked: true,
    },

    series: xArray,

    dataLabels: {
      enabled: true,

      formatter: function (val, opt) {
        return "$" + val;
      },
      offsetX: 0,
    },

    xaxis: {
      categories: ["Matt", "Lisa"],
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return "$" + value;
        },
      },
      title: {
        text: "Box Office",
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "$" + val;
        },
      },
    },
    grid: {
      show: false,
    },
    fill: {
      opacity: 0.5,
    },
    stroke: {
      show: true,

      colors: undefined,
      width: 1,
      dashArray: 0,
    },
  };

  var chart = new ApexCharts(document.querySelector("#chart"), options);

  chart.render();
}
