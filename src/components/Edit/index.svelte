<canvas
  bind:this={ canvas }
  width={ canvasWidth }
  height={ canvasHeight }
  on:pointerdown={ onDown }
></canvas>

<script lang="ts">
  import { on, off } from "../../utils";
  import { UndoRedo } from "./UndoRedo";
  import { onDestroy, onMount } from "svelte";
  import { Mosaic } from './Mosaic';
  import type { Position, MosaicParam } from './interface';
  import { storeImageUrl, storeCurrentImage, storeToolbarClick } from '../../store/index';

  const KEYZ: string = 'KeyZ';
  const KEYY: string = 'KeyY';

  let undoRedo = new UndoRedo;
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;
  let image = new Image();
  let position: Position = { x: 0, y: 0 };
  let mosaic: MosaicParam = { size: 20, degree: 5 };
  let canvasWidth: number = 1000;
  let canvasHeight: number = 500;

  onMount(() => {
    context = canvas.getContext('2d')
    on(document, 'keydown', onKeyDown)
  })

  onDestroy(() => {
    off(document, 'keydown', onKeyDown)
  })

  // Executed when the selected image changes
  $: $storeImageUrl, handleImgChange($storeImageUrl)

  $: $storeToolbarClick, handleToolbarClick($storeToolbarClick)

  function handleImgChange(url: string) {
    if (!url) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    image.src = url
    image.onload = () => {
      let dx: number, dy: number, dw: number, dh: number
      const { width, height } = image
      const imageRate = width / height
      const canvasRate = canvasWidth / canvasHeight
      // 如果宽高都比画布小，直接取图片大小，否则等比缩放
      if (width < canvasWidth && height < canvasHeight) {
        dw = width
        dh = height
      } else if (imageRate > canvasRate) {
        dw = canvasWidth
        dh = canvasWidth / imageRate
      } else {
        dh = canvasHeight
        dw = canvasHeight * imageRate
      }
      dx = (canvasWidth - dw) / 2
      dy = (canvasHeight - dh) / 2
      context.drawImage(image, dx, dy, dw, dh)
      undoRedo.insert(canvas)
      updateStore()
    }
  }

  function handleToolbarClick(info) {
    if (!info) return
    if (info.command === 'undo') undoRedo.undo(canvas, context)
    if (info.command === 'redo') undoRedo.redo(canvas, context)
  }

  function updateStore() {
    storeCurrentImage.set(undoRedo.current())
  }

  // ctrl + z and ctrl + y
  function onKeyDown(e: KeyboardEvent) {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      if (e.code === KEYZ) {
        undoRedo.undo(canvas, context)
      } else if (e.code === KEYY) {
        undoRedo.redo(canvas, context)
      }
      updateStore()
    }
  }

  function onDown(event: PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    if ($storeToolbarClick && $storeToolbarClick.command === 'mosaic') {
      document.onpointermove = (e: PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        const rect = canvas.getBoundingClientRect()
        Mosaic({ event: e, rect, position, mosaic, context, callback: (params: any) => {
            const { image, x, y, left, top } = params
            context.putImageData(image, x - left, y - top)
            position = { x, y }
          }
        })
      }
    }
    document.onpointerup = onUp
    document.onpointercancel = onUp
  }
  function onUp() {
    document.onpointermove = null
    document.onpointerup = null
    document.onpointercancel = null
    undoRedo.insert(canvas)
    updateStore()
  }
</script>