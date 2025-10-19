import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>

`;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "canvas";
document.body.appendChild(canvas);

type cursorType = { active: boolean; x: number; y: number };
const cursor = { active: false, x: 0, y: 0 };

const ctx = canvas.getContext("2d")!;

const lines: cursorType[][] = [];
const redoLines: cursorType[][] = [];

let currentline: cursorType[] | null = null;

const observer: EventTarget = new EventTarget();

function notify(name: string): void {
  observer.dispatchEvent(new Event(name));
}

function redraw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of lines) {
    if (line.length > 1) {
      ctx.beginPath();
      const { x, y } = line[0];
      ctx.moveTo(x, y);
      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

observer.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentline = null;

  notify("drawing-changed");
});

canvas.addEventListener("mousedown", (event) => {
  cursor.active = true;
  cursor.x = event.offsetX;
  cursor.y = event.offsetY;

  currentline = [];
  currentline.push({ active: true, x: cursor.x, y: cursor.y });
  lines.push(currentline);
  redoLines.splice(0, redoLines.length);

  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (event) => {
  if (cursor.active && ctx != null) {
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
    currentline?.push({ active: true, x: cursor.x, y: cursor.y });

    notify("drawing-changed");
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);

  notify("drawing-changed");
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    redoLines.push(lines.pop()!);

    notify("drawing-changed");
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) {
    lines.push(redoLines.pop()!);

    notify("drawing-changed");
  }
});
