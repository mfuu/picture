

export class UndoRedo {
  stack: Array<any>;
  index: number; // current index
  constructor() {
    this.stack = []
    this.index = -1
  }

  current(image: HTMLImageElement) {
    if (image) this.stack[this.index] = image
    return this.stack[this.index]
  }

  insert(canvas: HTMLCanvasElement) {
    const url = canvas.toDataURL()
    const image = new Image()
    image.src = url

    if (this.index < this.stack.length - 1) this.stack.length = this.index + 1
    this.stack.push(image)
    this.index += 1
  }

  revert(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    if (this.index > 0) {
      this.index = 0
      this.draw(canvas, context)
    }
  }

  undo(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    if (this.index > 0) {
      this.index -= 1
      this.draw(canvas, context)
    }
  }

  redo(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    if (this.index < this.stack.length - 1) {
      this.index += 1
      this.draw(canvas, context)
    }
  }

  draw(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const image = this.stack[this.index]
    if (!image) return
    this.clear(canvas, context)
    context.drawImage(image, 0, 0)
  }

  clear(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }
}