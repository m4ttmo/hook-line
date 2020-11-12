const covertIMG = (file) =>
  new Promise((resolve, reject) => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const pic = URL.createObjectURL(file);
    const hiddenIMG = document.getElementById("hiddenIMG");

    hiddenIMG.onload = () => {
      setTimeout(() => {
        ctx.canvas.width = hiddenIMG.clientWidth;
        ctx.canvas.height = hiddenIMG.clientHeight;

        ctx.drawImage(hiddenIMG, 0, 0);
        const url = canvas.toDataURL("image/jpeg");
        fetch(url)
          .then((res) => res.blob())
          .then((blob) => resolve(blob));
      }, 100);
    };
    hiddenIMG.src = pic;
  });

const shuff = (brr) => {
  const array = [...brr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const everyDayIMGShuffling = (buffer, numSeg) => {
  const len = buffer.byteLength;
  const arr = new Uint8Array(len);

  const segments = [];

  for (let i = 0; i < numSeg; i++) {
    const segment = buffer.slice(i * (len / numSeg), (i + 1) * (len / numSeg));
    segments.push(segment);
  }

  const head = segments.splice(0, 1);
  const foot = segments.splice(segments.length - 1, 1);
  const shuffdSegs = shuff(segments);
  const joind = [...head, ...shuffdSegs, ...foot];

  joind.forEach((aSeg, i) => {
    const position = i === 0 ? 0 : i * joind[i - 1].byteLength;
    arr.set(new Uint8Array(aSeg), position);
  });
  return arr.buffer;
};

const makeFile = (fileType, buffer) => {
  const arrayBufferView = new Uint8Array(buffer);
  const blob = new Blob([arrayBufferView], { type: fileType });
  return blob;
};

const loadFile = function (event) {
  const reader = new FileReader();
  reader.onload = function (evt) {
    const buffer = evt.target.result;
    const rnNumSeg = 4 + Math.round(Math.random() * 10);
    const newBuffer = everyDayIMGShuffling(buffer, rnNumSeg);
    const fileType = event.target.files[0].type;
    const file = makeFile(fileType, newBuffer);
    const pic = URL.createObjectURL(file);
    document.getElementById("output").src = pic;
  };
  covertIMG(event.target.files[0]).then((convertedFile) => {
    reader.readAsArrayBuffer(convertedFile);
  });
};
