import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>

`;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "canvas";
document.body.appendChild(canvas);
