<div
  bind:this={ clipRef }
  class="mu-picture__clip"
  style:display={ clipVisible ? '' : 'none' }
  style:width={ clipStyle.width + 'px' }
  style:height={ clipStyle.height + 'px' }
  style:left={ clipStyle.left + 'px' }
  style:top={ clipStyle.top + 'px' }
  on:pointerdown={ handlePointerDown }
>
  {#if maskVisible}
    <span class="mu-picture__clip-dot left-top" on:pointerdown={ (e) => handlePointerDown(e, 'lt') }></span>
    <span class="mu-picture__clip-dot top" on:pointerdown={ (e) => handlePointerDown(e, 't') }></span>
    <span class="mu-picture__clip-dot right-top" on:pointerdown={ (e) => handlePointerDown(e, 'rt') }></span>
    <span class="mu-picture__clip-dot right" on:pointerdown={ (e) => handlePointerDown(e, 'r') }></span>
    <span class="mu-picture__clip-dot right-down" on:pointerdown={ (e) => handlePointerDown(e, 'rd') }></span>
    <span class="mu-picture__clip-dot down" on:pointerdown={ (e) => handlePointerDown(e, 'd') }></span>
    <span class="mu-picture__clip-dot left-down" on:pointerdown={ (e) => handlePointerDown(e, 'ld') }></span>
    <span class="mu-picture__clip-dot left" on:pointerdown={ (e) => handlePointerDown(e, 'l') }></span>
  {/if}
</div>

<Mask
  style={ clipStyle }
  container={ container }
  on:start={ handleStartClip }
  on:move={ handleInitClip }
  on:end={ handleFinishedClip }
/>

<div bind:this={ cipFull } class="mu-picture__clip-hiddenfull"></div>

<script lang="ts">
  import Mask from './Mask.svelte'
  import { onMount } from 'svelte';
  import type { ClipStyle } from './interface';

  export let container: HTMLElement;

  let clipRef: HTMLElement;
  let cipFull: HTMLElement;
  let minSize: number = 50;
  let clipVisible: boolean = false;
  let maskVisible: boolean = false;
  const clipStyle: ClipStyle = { left: 0, top: 0, width: 0, height: 0 };
  const lastPostion = { x: 0, y: 0 };

  onMount(() => {
    const { clientWidth, clientHeight } = cipFull
    clipStyle.left = clientWidth / 2 - clipStyle.width / 2
    clipStyle.top = clientHeight / 2 - clipStyle.height / 2
  })

  function handleStartClip() {
    clipVisible = true
    maskVisible = false
  }

  function handleInitClip(e: CustomEvent) {
    const { top, left, height, width } = e.detail
    clipStyle.height = height
    clipStyle.width = width
    clipStyle.top = top
    clipStyle.left = left
  }

  function handleFinishedClip() {
    maskVisible = true
  }

  function handlePointerDown(event: PointerEvent, dir?: string) {
    event.preventDefault()
    event.stopPropagation()
    lastPostion.x = event.clientX
    lastPostion.y = event.clientY
    clipRef.style['will-change'] = 'top, left, width, height'
    document.onpointermove = (evt: PointerEvent) => {
      event.preventDefault()
      event.stopPropagation()
      // 获取鼠标位置，和元素初始offset进行对比，
      const chaX = evt.clientX - clipStyle.left
      const chaY = evt.clientY - clipStyle.top

      // 计算鼠标两次移动的差值
      const disX = evt.clientX - lastPostion.x
      const disY = evt.clientY - lastPostion.y

      switch (dir) {
        case 'lt':
          // 向左上方拉伸，改变 width, height, left, top
          if (chaX >= clipStyle.width - minSize || chaY >= clipStyle.height - minSize) return

          clipStyle.width += disX * -1
          clipStyle.height += disY * -1
          clipStyle.left += disX
          clipStyle.top += disY
          break
        case 't':
          // 向上拉伸，改变 height, top
          if (chaY >= clipStyle.height - minSize) return

          clipStyle.height += disY * -1
          clipStyle.top += disY
          break
        case 'rt':
          // 向右上方拉伸，改变 width, height, top
          if (chaX <= minSize || chaY >= clipStyle.height - minSize) return

          clipStyle.width += disX
          clipStyle.height += disY * -1
          clipStyle.top += disY
          break
        case 'r':
          // 向右拉伸，只改变 width
          if (chaX <= minSize) return

          clipStyle.width += disX
          break
        case 'rd':
          // 向右下方拉伸，改变 height, width
          if (chaX <= minSize || chaY <= minSize) return

          clipStyle.width += disX
          clipStyle.height += disY
          break
        case 'd':
          // 向下拉伸，只改变 height
          if (chaY <= minSize) return;

          clipStyle.height += disY
          break
        case 'ld':
          // 向左下方拉伸，改变 width, height, left
          if (chaX >= clipStyle.width - minSize || chaY <= minSize) return

          clipStyle.width += disX * -1
          clipStyle.height += disY
          clipStyle.left += disX
          break
        case 'l':
          // 向左拉伸，改变 width 和 left 值
          if (chaX >= clipStyle.width - minSize) return

          clipStyle.width += disX * -1
          clipStyle.left += disX
          break
        default:
          // 如果按下位置不在点上，整体移动
          clipStyle.left += disX
          clipStyle.top += disY
          break
      }
      // reset position
      lastPostion.x = evt.clientX
      lastPostion.y = evt.clientY
    }
    document.onpointerup = onUp
    document.onpointercancel = onUp
  }
  function onUp() {
    clipRef.style['will-change'] = 'auto'
    document.onpointermove = null
    document.onpointerup = null
    document.onpointercancel = null
  }
</script>

<style>
  .mu-picture__clip {
    position: absolute;
    cursor: move;
    z-index: 9009;
  }
  .mu-picture__clip-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    background: #FFF;
  }
  .mu-picture__clip-dot.left-top {
    top: -4px;
    left: -4px;
    cursor: nw-resize;
  }
  .mu-picture__clip-dot.top {
    top: -4px;
    left: 50%;
    margin-left: -4px;
    cursor: n-resize;
  }
  .mu-picture__clip-dot.right-top {
    top: -4px;
    right: -4px;
    cursor: ne-resize;
  }
  .mu-picture__clip-dot.right {
    top: 50%;
    margin-top: -4px;
    right: -4px;
    cursor: e-resize;
  }
  .mu-picture__clip-dot.right-down {
    bottom: -4px;
    right: -4px;
    cursor: se-resize;
  }
  .mu-picture__clip-dot.down {
    bottom: -4px;
    left: 50%;
    margin-left: -4px;
    cursor: s-resize;
  }
  .mu-picture__clip-dot.left-down {
    bottom: -4px;
    left: -4px;
    cursor: sw-resize;
  }
  .mu-picture__clip-dot.left {
    top: 50%;
    margin-top: -4px;
    left: -4px;
    cursor: w-resize;
  }
  .mu-picture__clip-hiddenfull {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
  }
</style>