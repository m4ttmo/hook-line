var rnd1;
var rnd2;
var rnd3;
var cred;


window.onload = checkCookie();


function newCred() {
    var d = new Date();
    d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
    var expires = ";expires = " + d.toGMTString();
    document.cookie = "Check = 1" + expires;
    document.cookie = "credAmt = " + cred + expires;
    console.log(document.cookie);
    console.log(cred);
    game()
}

function roll() {
    if (cred >= 10) {
        rndNum();
        document.getElementById("cred").innerHTML = cred;
        
    }
    else {
        document.getElementById("note").innerHTML = "*Please add more credit";
    }
}
function rndNum() {
    
    rnd1 = Math.floor(Math.random() * Math.floor(9));
    rnd2 = Math.floor(Math.random() * Math.floor(9));
    rnd3 = Math.floor(Math.random() * Math.floor(9));

    document.getElementById("num1").innerHTML = rnd1;
    document.getElementById("num2").innerHTML = rnd2;
    document.getElementById("num3").innerHTML = rnd3;

    
    if ((rnd1 == rnd2) && (rnd1 == rnd3)) {
        win();
    }
    else {
        cred = cred - 10;
        document.cookie = "credAmt = " + cred;
    }
}
function win() {
    setTimeout(function () { alert("Yay win."); }, 200);
    cred += 100;
    document.cookie = "credAmt = " + cred;
}
    
function addCred() {
    
}
function loadPrev(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(";");
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


function checkCookie() {
    var cookiechk = loadPrev("Check");
    var credPast = loadPrev("credAmt");
    if (cookiechk != 1) {
        cred = 100;
        document.getElementById("cred").innerHTML = cred;
        newCred();  
     }
    else {
        cred = credPast;
        document.getElementById("cred").innerHTML = cred;
        game();
            
    }
}
function game() {
    document.getElementById("numBut").addEventListener("click", roll);
}
