function validateForm() {
  //document.getElementById("frm1").submit();
  var inpObj = document.getElementById("frm1");
  if (!inpObj.checkValidity()) {
    alert("Missing Fields");
  } else {
    submitForm();
  }
}

function submitForm() {
  //e.preventDefault();
  var FilmTitle = document.getElementById("FilmId").value;
  var ContentType = "_" + document.getElementById("ContId").value;
  var TypeModifier = document.getElementById("TypeModId").value;
  var Aspect = "_" + document.getElementById("AspectId").value;
  // var Aspect = document.querySelector('input[name="Aspect"]:checked').value;
  var AspectModifier = document.getElementById("AspectModId").value;
  var SpokenLang = document.getElementById("DLangId").value;
  var Subtitles = document.getElementById("SLangId").value;
  var SecSubtitles = document.getElementById("S2LangId").value;
  var Territory = "_" + document.getElementById("TetId").value;
  var TerritoryModifier = document.getElementById("TetModId").value;
  var AudioModifier = document.getElementsByClassName("AudioModId");
  //   var AudioModifier = "-" + document.querySelector('input[name="AudioModifier"]:checked').value;
  var Resolution = "_" + document.getElementById("ResId").value;
  var Studio = "_" + document.getElementById("StudioId").value;
  var MasterDate = "_" + document.getElementById("DateId").value;
  var Facility = "_" + document.getElementById("FacilityId").value;
  var Standard = "_" + document.getElementById("StandardId").value;
  var PackageType = "_" + document.getElementById("PackTypeId").value;

  // Do something with the input value
  var Print = document.getElementById("FinalAtxt");

  //For settinf the - modifier to on/off
  if (TypeModifier != (null || 0)) {
    TypeModifier = "-" + document.getElementById("TypeModId").value;
  }
  if (AspectModifier != (null || 0)) {
    AspectModifier = "-" + document.getElementById("AspectModId").value;
  }
  if (TerritoryModifier != (null || 0)) {
    TerritoryModifier = "-" + document.getElementById("TetModId").value;
  }
  /* if (AudioModifier != (null || 0)) {
        AudioModifier = "-" + document.getElementById("AudioModId").checked;
    }; 

    if (AudioModifier == true){
        AudioModifier = "-" + document.getElementById("AudioModId").value;
    };   
    */
  var holder;
  var checked = [];
  for (var i = 0; AudioModifier[i]; ++i) {
    if (AudioModifier[i].checked) {
      checked.push("-" + AudioModifier[i].value);
    }
  }
  console.log(checked);
  var firstAudio = checked[0].includes("-");
  console.log(firstAudio);

  /* if (firstAudio == true){
        console.log("_" + checked[0]);
        console.log(holder);
        checked[0] = [];
        checked[0].push("_" + holder);
    }*/

  var checkedStr = checked.filter((n) => n).join("");
  checkedStr = checkedStr.replace("-", "_");
  //Language long from to code
  SpokenLang = SpokenLang.toUpperCase().replace(/\s/g, "");
  Subtitles = Subtitles.toUpperCase().replace(/\s/g, "");
  SecSubtitles = SecSubtitles.toUpperCase().replace(/\s/g, "");
  /*
    if (SpokenLang == "ENGLISH"){
        SpokenLang = "_" +"EN"
    };
    else{
        alert("Not a Language");
    }; */

  //Language Dictionary
  var Langdict = {
    ENGLISH: "EN",
    ARABIC: "AR",
    BULGARIAN: "BG",
    BOSNIAN: "BS",
    CATALAN: "CA",
    CZECH: "CS",
    DANISH: "DA",
    GERMAN: "DE",
    GREEK: "EL",
    SPANISH: "ES",
    ESTONIAN: "ET",
    EUSKARA: "EU",
    FINNISH: "FI",
    FRENCH: "FR",
    HEBREW: "HE",
    HINDI: "HI",
    CROATIAN: "HR",
    HUNGARIAN: "HU",
    INDONESIAN: "IND",
    ICELANDIC: "IS",
    ITALIAN: "IT",
    JAPANESE: "JA",
    KYRGYZ: "KG",
    KAZAKH: "KK",
    KOREAN: "KO",
    LATAM: "LAS",
    LITHUANIAN: "LT",
    LATVIAN: "LV",
    MONGOLIAN: "MN",
    MUTE: "MOS",
    MALAYASIAN: "MSA",
    DUTCH: "NL",
    NORWEGIAN: "NO",
    POLISH: "PL",
    PORTUGUESE: "PT",
    BRAZILIAN: "QBP",
    BRAZILIANPORTUGUESE: "QBP",
    FRENCHCANADIAN: "QFC",
    MANDARINSIMPLIFIED: "QMS",
    MANDARINTRADITIONAL: "QMT",
    TAIWANESE: "QTM",
    ROMANIAN: "RO",
    RUSSIAN: "RU",
    SLOVAK: "SK",
    SLOVENIAN: "SL",
    ALBANIAN: "SQ",
    SERBIAN: "SR",
    SWEDISH: "SV",
    TAMIL: "TA",
    TELUGU: "TE",
    THAI: "TH",
    TURKISH: "TR",
    UKRAINIAN: "UK",
    VIETNAMESE: "VI",
    FLEMISH: "VLS",
    CANTONESE: "YUE",
    NONE: "XX",
    XX: "XX",
  };

  if (!(SpokenLang in Langdict)) {
    alert("Please check Spoken Language");
  } else {
    SpokenLang = "_" + Langdict[SpokenLang];
  }

  if (Subtitles != (null || 0)) {
    Subtitles = "-" + Langdict[Subtitles];
  }

  if (SecSubtitles != (null || 0)) {
    SecSubtitles = "-" + Langdict[SecSubtitles];
  }

  var Printarray = [
    FilmTitle,
    ContentType,
    TypeModifier,
    Aspect,
    AspectModifier,
    SpokenLang,
    Subtitles,
    SecSubtitles,
    Territory,
    TerritoryModifier,
    checkedStr,
    Resolution,
    Studio,
    MasterDate,
    Facility,
    Standard,
    PackageType,
  ]
    .filter((n) => n)
    .join("");
  //Print.innerHTML = checkedStr;

  Print.innerHTML = Printarray;
}
