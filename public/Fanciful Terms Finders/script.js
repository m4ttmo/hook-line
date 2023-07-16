var textArry;
var Dic;
var currWord;
var fancy = [];
var firstLet;
var fileSelect = "holder.csv";
var i = 0;
var loadedTxt;

const fileInput = document.getElementById("txt");
const readFile = () => {
  const reader = new FileReader();
  reader.readAsBinaryString(fileInput.files[0]);
  reader.onload = () => {
    var readFile = reader.result;
    loadedTxt = readFile.split(/[\s,]+/);
    CompareWrds();
  };
};
fileInput.addEventListener("change", readFile);

function CompareWrds() {
  textArry = [...new Set(loadedTxt)];

  itteration: while (i < textArry.length) {
    var progress = (i / textArry.length) * 100;
    document.getElementById("progBar").style.display = "block";
    document.getElementById("progBar").value = progress;
    textArry[i] = textArry[i].toUpperCase();
    console.log(textArry[i]);
    firstLet = Array.from(textArry[i])[0];
    switch (firstLet) {
      case "A":
        fileSelect = "A.csv";
        loadDic();
        break itteration;
      case "B":
        fileSelect = "B.csv";
        loadDic();
        break itteration;
      case "C":
        fileSelect = "C.csv";
        loadDic();
        break itteration;
      case "D":
        fileSelect = "D.csv";
        loadDic();
        break itteration;
      case "E":
        fileSelect = "E.csv";
        loadDic();
        break itteration;
      case "F":
        fileSelect = "F.csv";
        loadDic();
        break itteration;
      case "G":
        fileSelect = "G.csv";
        loadDic();
        break itteration;
      case "H":
        fileSelect = "H.csv";
        loadDic();
        break itteration;
      case "I":
        fileSelect = "I.csv";
        loadDic();
        break itteration;
      case "J":
        fileSelect = "J.csv";
        loadDic();
        break itteration;
      case "K":
        fileSelect = "K.csv";
        loadDic();
        break itteration;
      case "L":
        fileSelect = "L.csv";
        loadDic();
        break itteration;
      case "M":
        fileSelect = "M.csv";
        loadDic();
        break itteration;
      case "N":
        fileSelect = "N.csv";
        loadDic();
        break itteration;
      case "O":
        fileSelect = "O.csv";
        loadDic();
        break itteration;
      case "P":
        fileSelect = "P.csv";
        loadDic();
        break itteration;
      case "Q":
        fileSelect = "Q.csv";
        loadDic();
        break itteration;
      case "R":
        fileSelect = "R.csv";
        loadDic();
        break itteration;
      case "S":
        fileSelect = "S.csv";
        loadDic();
        break itteration;
      case "T":
        fileSelect = "T.csv";
        loadDic();
        break itteration;
      case "U":
        fileSelect = "U.csv";
        loadDic();
        break itteration;
      case "V":
        fileSelect = "V.csv";
        loadDic();
        break itteration;
      case "W":
        fileSelect = "W.csv";
        loadDic();
        break itteration;
      case "X":
        fileSelect = "X.csv";
        loadDic();
        break itteration;
      case "Y":
        fileSelect = "Y.csv";
        loadDic();
        break itteration;
      case "Z":
        fileSelect = "Z.csv";
        loadDic();
        break itteration;
      default:
        fileSelect = "holder.csv";
        i++;
    }
  }
  if (i >= textArry.length) {
    printResults();
  }
}

function loadDic() {
  const selectedFile = fileSelect;
  d3.csv(selectedFile).then(function (data) {
    Dic = Object.values(data);

    find();
  });
}

function find() {
  let hold = textArry[i];
  hold = hold.replace(/[.,\/#!$%\^&\*;:{}=\-_'`~()]/g, "");

  let found = Dic.find(({ Word }) => Word === hold);
  console.log("found: " + found);
  if (found == null) {
    fancy.push(hold);
  } else {
    currWord = Object.values(found);
    console.log("currWord: " + currWord);
  }
  i++;

  CompareWrds();
}

function printResults() {
  document.getElementById("out").innerHTML = "Terms: " + fancy.length;
  document.getElementById("progBar").style.display = "none";
  document.getElementById("termsList").style.display = "block";

  for (i = 0; i < fancy.length; i++) {
    listItem = document.createElement("li");
    listItem.innerHTML = fancy[i];
    document.getElementById("termsList").appendChild(listItem);
  }
}
