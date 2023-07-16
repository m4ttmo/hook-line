var CPL;
let button = document.querySelector(".trBtn");

button.addEventListener("click", () => {
  CPL = document.getElementById("CPLinput").value;

  let CPLarray = CPL.split("_");
  console.log(CPLarray);

  var FlmTtl = CPLarray[0];
  var CntTyp = CPLarray[1];
  //var CntTypM = CPLarray[];
  var Aspct = CPLarray[2];
  var lang = CPLarray[3];
  var trrty = CPLarray[4];
  var audtyp = CPLarray[5];
  var res = CPLarray[6];
  var studio = CPLarray[7];
  var date = CPLarray[8];
  var facility = CPLarray[9];
  var stndrd = CPLarray[10];
  var pckType = CPLarray[11];

  let SpltLang = lang.split("-");

  let arrayLength = SpltLang.length;

  for (let i = 0; i < arrayLength; i++) {
    console.log(i, SpltLang[i]);
    if (SpltLang[i] === "XX") {
      SpltLang[i] = "NONE";
      console.log(i, SpltLang[i]);
    }
  }

  let audLang = SpltLang[0];
  let subLang = SpltLang[1];
  let addLang = SpltLang[2];
  var access;

  if (addLang === "OCAP" || addLang === "CCAP") {
    access = SpltLang[2];
  }

  document.getElementById("flmTitlBox").innerHTML = FlmTtl;
  document.getElementById("CntTypBox").innerHTML = CntTyp;
  document.getElementById("AspctBox").innerHTML = Aspct;
  document.getElementById("AudlangBox").innerHTML = audLang;
  document.getElementById("SublangBox").innerHTML = subLang;
  document.getElementById("addlangBox").innerHTML = addLang;
  document.getElementById("accessBox").innerHTML = access;
  document.getElementById("trrtyBox").innerHTML = trrty;
  document.getElementById("audtypBox").innerHTML = audtyp;
  document.getElementById("resBox").innerHTML = res;
  document.getElementById("studioBox").innerHTML = studio;
  document.getElementById("dateBox").innerHTML = date;
  document.getElementById("facilityBox").innerHTML = facility;
  document.getElementById("stndrdBox").innerHTML = stndrd;
  document.getElementById("pckTypeBox").innerHTML = pckType;
});
