btns = document.getElementsByClassName("aplha");
entr = document.getElementById("enter");
let weedle = ["w", "e", "e", "d", "l", "e"];
let answer = [];
let x = 0;

for (i = 0; i < btns.length; i++) {
  btns[i].addEventListener("click", function () {
    document.getElementById("l" + x).innerHTML = weedle[x];
    x++;
    console.log("i = " + i);
    console.log(x);
  });
}
entr.addEventListener("click", function () {
  if (x == 6) {
    window.confirm("CONGRATS YOU GOT WEEDLE");
    var r = document.createRange();
    r.selectNode(document.getElementById(copyTextarea));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
    try {
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
      console.log("Successfully copy text r");
    } catch (err) {
      console.log("Unable to copy!");
    }
  } else {
    alert("You need to type 6 letters, Weedle is ANGRY");
  }
});
