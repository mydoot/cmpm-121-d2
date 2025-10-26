import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>

  <div class="Canvas"></div>
  <div class="Commands"></div>
  <div class="Tools"></div>
`;

const canvasContainer: Element = document.querySelector(".Canvas")!;
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "canvas";
canvasContainer.appendChild(canvas);

const ctx = canvas.getContext("2d")!;

const commands: Drawable[] = [];
const redoCommands: Drawable[] = [];

let cursorCommand: CursorCommand | null = null;
let currentLineCommand: LineCommand | null = null;

type Point = { x: number; y: number };

let markerSize: number = 1;

const observer: EventTarget = new EventTarget();

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

class LineCommand implements Drawable {
  public points: Point[];
  public thickness: number;

  constructor(x: number, y: number, size: number) {
    this.points = [{ x, y }];
    this.thickness = size;
  }
  display(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    const { x, y } = this.points[0];
    ctx.moveTo(x, y);
    for (const { x, y } of this.points) {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  draw(x: number, y: number): void {
    this.points.push({ x, y });
  }

}

class CursorCommand implements Drawable {
  private x: number;
  private y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "32px monospace";
    //ctx.fillText("*", this.x - 8, this.y + 16);
  }
}

function notify(name: string): void {
  observer.dispatchEvent(new Event(name));
}

function redraw(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  commands.forEach((cmd) => {
    cmd.display(ctx);
  });

  if (cursorCommand) {
    cursorCommand.display(ctx);
  }
}

observer.addEventListener("drawing-changed", () => redraw(ctx)!);
observer.addEventListener("cursor-changed", () => redraw(ctx)!);

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;

  notify("drawing-changed");
});

canvas.addEventListener("mousedown", (event) => {
  currentLineCommand = new LineCommand(event.offsetX, event.offsetY, markerSize);
  commands.push(currentLineCommand);
  redoCommands.splice(0, redoCommands.length);
  //console.log("mousdown");

  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (event) => {
  cursorCommand = new CursorCommand(event.offsetX, event.offsetY);

  notify("cursor-changed");

  if (event.buttons == 1) {
    //  console.log("mousemove");
    currentLineCommand!.points.push({ x: event.offsetX, y: event.offsetY });
    notify("drawing-changed");
  }
});

const commandContainer: Element = document.querySelector('.Commands')!;

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
commandContainer.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(0, commands.length);

  notify("drawing-changed");
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
commandContainer.append(undoButton);

undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    redoCommands.push(commands.pop()!);

    notify("drawing-changed");
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
commandContainer.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    commands.push(redoCommands.pop()!);

    notify("drawing-changed");
  }
});

const toolContainer: Element = document.querySelector('.Tools')!;

const thinMarkerButton = document.createElement("button");
thinMarkerButton.innerHTML = "Thin Marker";
toolContainer.append(thinMarkerButton);

thinMarkerButton.addEventListener("click", () => {
  markerSize = 1;

  notify("cursor-changed");
});

const thickMarkerButton = document.createElement("button");
thickMarkerButton.innerHTML = "Thick Marker";
toolContainer.append(thickMarkerButton);

thickMarkerButton.addEventListener("click", () => {
  markerSize = 5;

  notify("cursor-changed");
});
