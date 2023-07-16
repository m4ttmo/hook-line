var psswrd;
var asciiCode = [];
var uCase = [65, 90];
var lCase = [97, 122];
var numCase = [48, 57];
var spCase1 = [33, 47];
var spCase2 = [58, 64];
var spCase3 = [91, 96];
var spCase4 = [123, 126];
var combined = [];


function checker() {
    var upps = document.getElementById("upps");
    var lows = document.getElementById("lows");
    var nums = document.getElementById("nums");
    var specs = document.getElementById("specs");

    if (upps.checked == false && lows.checked == false && nums.checked == false && specs.checked == false) {
        window.alert("One option must be selected"); 
    }
    else {
       if (upps.checked == true) {
            /* asciiMin = 65;
            asciiMax = 90;*/
           
           combined.push(...uCase);
           console.log("combined: " + combined);
        }
        if (lows.checked == true) {
            /*asciiMax = 122;
            console.log("Lower: " + asciiMin + ":" + asciiMax)*/
            combined.push(...lCase);
            console.log("combined: " + combined);
        }
        if (nums.checked == true) {
            /*asciiMin = 40;
            console.log("Numbers: " + asciiMin + ":" + asciiMax)*/
            combined.push(...numCase);
            console.log("combined: " + combined);
        }
        
        if (specs.checked == true) {
            combined.push(...spCase1, ...spCase2, ...spCase3, ...spCase4);
            console.log("combined: " + combined)
    }
        
        pssGen();  
    }
    reset();
}
function pssGen() {
    var psslngth = document.getElementById("len").value;
    if (psslngth < 4) {
        window.alert("Password length must be 4 or greater")
        reset;
    }
    else {
        var combo = [];
        for (i = 0; i < combined.length; i++){
            if (i % 2 === 0) {
                for (x = combined[i]; x <= combined[i+1]; x++){
                    combo.push(x);
                }  
            } 
        }   
        console.log(combo);
        for (i = 1; i <= psslngth; i++ ){
            min = 0;
            max = combo.length;
            map = Math.floor(Math.random() * (max - min) + min);
            asciiCode[i] = combo[map];
        }
        psslngth = 0;
        combined = [];
        decode();  
    }
}
function decode() {
    psswrd = String.fromCharCode(...asciiCode);
    console.log("Password: "+psswrd);
    printPW();
}
function printPW() {
    document.getElementById("psswrdShw").innerHTML = psswrd;
    reset();
}
function reset() {
    asciiCode = [];
    asciiMin = 0;
    asciiMax = 0;
}
let button = document.querySelector('.DRKMD')

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const newColorScheme = e.matches ? "dark" : "light";
});
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    
}

button.addEventListener('click', ()=>{
    if (button.value === '🌝') {
        button.value = '🌞';
        document.querySelector('.hdr').style.color = "#FEC502";

        var x = document.getElementsByTagName("*");
        for (i = 0; i < x.length; i++) {
            x[i].style.color = '#FEC502';
            document.getElementById("genPsswrd").style.backgroundColor = "#FEC502";
        }
        
        document.body.style.backgroundColor = "#130C0B";

    }
    else {
        button.value = '🌝';
        document.querySelector('.hdr').style.color = "#130C0B";
        document.body.style.backgroundColor = "#FEC502";
        var x = document.getElementsByTagName("*");
        for (i = 0; i < x.length; i++) {
            x[i].style.color = '#130C0B';
            document.getElementById("genPsswrd").style.backgroundColor = "#130C0B";
        }
    }
})