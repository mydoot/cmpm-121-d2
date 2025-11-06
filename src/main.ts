import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>

  <div class="Canvas"></div>
  <div class="Commands"></div>
  <div class="Tools"></div>
  <div class="Sliders"></div>
  <div class="Stickers"></div>
  <div class="Other"></div>
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
    ctx.strokeStyle = `hsl(${hueValue}, 100%, 50%)`;
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

class StickerCommand implements Drawable {
  private emojiSticker: string;
  private points: Point;

  constructor(x: number, y: number, code: number) {
    this.emojiSticker = String.fromCodePoint(code);
    this.points = { x, y };
  }
  display(ctx: CanvasRenderingContext2D): void {
    ctx.font = "25px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.emojiSticker, this.points.x, this.points.y);
  }
  changePoints(x: number, y: number) {
    this.points = { x, y };
  }
  /*  draw(x: number, y: number): void {
     //this.points.push({ x, y });
   } */
}

// Use this when implementing distinctive marker types (like a scribble vs reg)
/* class MarkerCommand implements Drawable {
  private markerType: string;


  constructor(string: string) {
    this.markerType = string;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "32px monospace";
    //ctx.fillText("*", this.x - 8, this.y + 16);
  }
} */

class CursorCommand implements Drawable {
  protected x: number;
  protected y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save(); // Isolate the temporary styles

    // Set the style for the preview
    ctx.strokeStyle = `hsl(${hueValue}, 100%, 50%)`;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = `hsl(${hueValue}, 100%, 50%)`;

    const radius = markerSize / 2;

    ctx.beginPath();
    // Draw the circle centered at (x, y) with the calculated radius
    ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

class CursorStickerCommand extends CursorCommand {
  private sticker: string;
  constructor(x: number, y: number, code: number) {
    super(x, y);
    this.sticker = String.fromCodePoint(code);
  }
  override display(ctx: CanvasRenderingContext2D) {
    // example: draw the sticker centered at x,y
    ctx.save();
    ctx.font = "25px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.sticker, this.x, this.y);
    ctx.restore();
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
observer.addEventListener("tool-moved", () => redraw(ctx)!);

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;

  notify("tool-moved");
});

/* canvas.addEventListener("mouseout", (event) => {
  if (stickerMode) {
    cursorCommand = new CursorStickerCommand(
      event.offsetX,
      event.offsetY,
      sticker,
    );
  } else {
    cursorCommand = new CursorCommand(event.offsetX, event.offsetY);
  }

  notify("tool-moved");
}); */

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;

  notify("drawing-changed");
});

canvas.addEventListener("mousedown", (event) => {
  if (stickerMode) {
    stickerCommand = new StickerCommand(
      event.offsetX,
      event.offsetY,
      sticker,
    );
    commands.push(stickerCommand);
    redoCommands.splice(0, redoCommands.length);
  } else {
    currentLineCommand = new LineCommand(
      event.offsetX,
      event.offsetY,
      markerSize,
    );
    commands.push(currentLineCommand);
    redoCommands.splice(0, redoCommands.length);
  }
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (event) => {
  if (stickerMode) {
    cursorCommand = new CursorStickerCommand(
      event.offsetX,
      event.offsetY,
      sticker,
    );
  } else {
    cursorCommand = new CursorCommand(event.offsetX, event.offsetY);
  }

  notify("tool-moved");

  if (event.buttons == 1) {
    if (!stickerMode) {
      currentLineCommand!.points.push({ x: event.offsetX, y: event.offsetY });
    } else {
      stickerCommand!.changePoints(event.offsetX, event.offsetY);
    }
    notify("drawing-changed");
  }
});

const commandContainer: Element = document.querySelector(".Commands")!;

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

const toolContainer: Element = document.querySelector(".Tools")!;

// Refactor marker buttons with a for loop later
const thinMarkerButton = document.createElement("button");
thinMarkerButton.innerHTML = "Thin Marker";
toolContainer.append(thinMarkerButton);

thinMarkerButton.addEventListener("click", () => {
  sticker = 0;
  stickerMode = false;
  markerSize = 1;

  notify("tool-moved");
});

const thickMarkerButton = document.createElement("button");
thickMarkerButton.innerHTML = "Thick Marker";
toolContainer.append(thickMarkerButton);

thickMarkerButton.addEventListener("click", () => {
  sticker = 0;
  stickerMode = false;
  markerSize = 5;

  notify("tool-moved");
});

let stickerMode: boolean | null = null;
let stickerCommand: StickerCommand | null = null;
let sticker: number = 0;

const stickerContainer: Element = document.querySelector(".Stickers")!;

const smileyEmojiSticker = document.createElement("button");
smileyEmojiSticker.innerHTML = "&#128523;";
stickerContainer.append(smileyEmojiSticker);

smileyEmojiSticker.addEventListener("click", () => {
  sticker = 128523;
  stickerMode = true;

  notify("tool-moved");
});

const peaceEmojiSticker = document.createElement("button");
peaceEmojiSticker.innerHTML = "&#9996;";
stickerContainer.append(peaceEmojiSticker);

peaceEmojiSticker.addEventListener("click", () => {
  sticker = 9996;
  stickerMode = true;

  notify("tool-moved");
});

const thumbsupEmojiSticker = document.createElement("button");
thumbsupEmojiSticker.innerHTML = "&#128077;";
stickerContainer.append(thumbsupEmojiSticker);

thumbsupEmojiSticker.addEventListener("click", () => {
  sticker = 128077;
  stickerMode = true;

  notify("tool-moved");
});

const customSticker = document.createElement("button");
customSticker.innerHTML = "Custom";
stickerContainer.append(customSticker);

customSticker.addEventListener("click", () => {
  const customID = prompt(
    `Input a custom sticker\n(Must be a UTF-8 emoji )`,
    "",
  );
  if (customID == null) {
    console.log("User cancelled prompt or inputted an invalid entry.");
  } else {
    sticker = parseInt(customID);
  }
  stickerMode = true;

  notify("tool-moved");
});

const otherContainer: Element = document.querySelector(".Other")!;

const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
otherContainer.append(exportButton);

function exportCanvas(): void {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  canvas.className = "canvas";
  canvas.style.backgroundColor = "#FFFFFF";
  const ctx = canvas.getContext("2d")!;
  ctx.scale(4, 4);
  /* ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height); */
  cursorCommand == null;
  redraw(ctx);

  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
}

exportButton.addEventListener("click", () => {
  exportCanvas();

  notify("tool-moved");
});

let hueValue: number | null = null;

const sliderContainer: Element = document.querySelector(".Sliders")!;

const hueSlider = document.createElement("input");
/* hueSlider.innerHTML = "Hue Slider"; */
hueSlider.type = "range";
hueSlider.className = "slider";
hueSlider.min = "0";
hueSlider.max = "360";
hueSlider.value = "0";
sliderContainer.append(hueSlider);

hueSlider.addEventListener("input", () => {
  hueValue = parseInt(hueSlider.value);

  notify("tool-moved");
});
