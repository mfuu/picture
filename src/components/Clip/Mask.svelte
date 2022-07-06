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

  export let style: ClipStyle;
  export let container: HTMLElement;
  const dispatch = createEventDispatcher()
  let clipStyle: ClipStyle = { left: 0, top: 0, width: 0, height: 0 };

  function formatNum(num: number) {
    return num <= 0 ? 0 : num
  }

  function handlePointerDown(event: PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    const rect = container.getBoundingClientRect()
    clipStyle.left = event.clientX - rect.left
    clipStyle.top = event.clientY - rect.top
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
      // 向上/向左拖拽
      if (disX < 0) clipStyle.left = e.clientX - rect.left
      if (disY < 0) clipStyle.top = e.clientY - rect.top
      dispatch('move', clipStyle)
    }
    document.onpointerup = onUp
    document.onpointercancel = onUp
  }
  function onUp() {
    document.onpointermove = null
    document.onpointerup = null
    document.onpointercancel = null
    dispatch('end')
  }
</script>