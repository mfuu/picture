<canvas
  bind:this={ canvas }
  width="0"
  height="0"
  on:pointerdown={ onDown }
></canvas>

<script lang="ts">
  import { on, off } from "../../utils";
  import { UndoRedo } from "./UndoRedo";
  import { onDestroy, onMount } from "svelte";
  import { Mosaic } from './Mosaic';
  import type { Position, MosaicParam } from './interface';
  import { storeImageUrl, storeCurrentImage } from '../../store/index';

  const KEYZ: string = 'KeyZ';
  const KEYY: string = 'KeyY';

  let undoRedo = new UndoRedo;
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;
  let image = new Image();
  let position: Position = { x: 0, y: 0 };
  let mosaic: MosaicParam = { size: 30, degree: 5 };

  // Executed when the selected image changes
  $: $storeImageUrl, handleImgChange($storeImageUrl)

  function handleImgChange(url: string) {
    if (!url) return
    image.src = url
    image.onload = () => {
      const { width, height } = image
      canvas.width = width
      canvas.height = height
      context.drawImage(image, 0, 0, width, height)
      undoRedo.insert(canvas)
      storeCurrentImage.set(undoRedo.current())
    }
  }

  onMount(() => {
    context = canvas.getContext('2d')
    on(document, 'keydown', onKeyDown)
  })

  onDestroy(() => {
    off(document, 'keydown', onKeyDown)
  })

  // ctrl + z and ctrl + y
  function onKeyDown(e: KeyboardEvent) {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      if (e.code === KEYZ) {
        undoRedo.undo(canvas, context)
      } else if (e.code === KEYY) {
        undoRedo.redo(canvas, context)
      }
      storeCurrentImage.set(undoRedo.current())
    }
  }

  function onDown(event: PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
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
    document.onpointerup = onUp
    document.onpointercancel = onUp
  }
  function onUp() {
    document.onpointermove = null
    document.onpointerup = null
    undoRedo.insert(canvas)
    storeCurrentImage.set(undoRedo.current())
  }
</script>

<style>

</style>