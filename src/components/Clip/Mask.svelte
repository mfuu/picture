<!-- top -->
<div
  class="mu-picture__clip-mask top"
  style:height={ formatNum(style.top) + 'px' }
  on:pointerdown={ handlePointerDown }
></div>
<!-- right -->
<div
  class="mu-picture__clip-mask right"
  style:top={ style.top + 'px' }
  style:left={ style.left + style.width + 'px' }
  style:height={ style.height + 'px' }
  on:pointerdown={ handlePointerDown }
></div>
<!-- bottom -->
<div
  class="mu-picture__clip-mask bottom"
  style:top={ style.top + style.height + 'px' }
  on:pointerdown={ handlePointerDown }
></div>
<!-- left -->
<div
  class="mu-picture__clip-mask left"
  style:top={ style.top + 'px' }
  style:width={ formatNum(style.left) + 'px' }
  style:height={ style.height + 'px' }
  on:pointerdown={ handlePointerDown }
></div>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ClipStyle } from './interface';

  export let style;
  const dispatch = createEventDispatcher()
  let clipStyle: ClipStyle = { left: 0, top: 0, width: 0, height: 0 };

  function formatNum(num: number) {
    return num <= 0 ? 0 : num
  }

  function handlePointerDown(event: PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    clipStyle.left = event.clientX
    clipStyle.top = event.clientY
    let started: boolean = false
    document.onpointermove = (e) => {
      if (!started) {
        started = true
        dispatch('start')
      }
      const disX = e.clientX - event.clientX
      const disY = e.clientY - event.clientY
      clipStyle.width = Math.abs(disX)
      clipStyle.height = Math.abs(disY)
      if (disX < 0) clipStyle.left = e.clientX
      if (disY < 0) clipStyle.top = e.clientY
      dispatch('move', clipStyle)
    }
    document.onpointerup = onUp
    document.onpointercancel = onUp
  }
  function onUp() {
    document.onpointermove = null
    document.onpointerup = null
    document.onpointercancel = null
  }
</script>

<style>
  .mu-picture__clip-mask {
    position: absolute;
    background-color: #000;
    opacity: 0.5;
    cursor: crosshair;
  }
  .mu-picture__clip-mask.top {
    left: 0;
    top: 0;
    right: 0;
  }
  .mu-picture__clip-mask.right {
    right: 0;
  }
  .mu-picture__clip-mask.bottom {
    bottom: 0;
    left: 0;
    right: 0;
  }
  .mu-picture__clip-mask.left {
    left: 0;
  }
</style>