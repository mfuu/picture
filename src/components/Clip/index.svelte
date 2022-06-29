<div
  bind:this={ clipRef }
  class="mu-picture-clip"
  style:width={ clipStyle.width }
  style:height={ clipStyle.height }
  style:left={ clipStyle.left }
  style:top={ clipStyle.top }
  on:pointerdown={ handlePointerDown }
>
  <div class="mu-picture-clip-dot left-top" on:pointerdown={ (e) => handlePointerDown(e, 'lt') }></div>
  <div class="mu-picture-clip-dot top" on:pointerdown={ (e) => handlePointerDown(e, 't') }></div>
  <div class="mu-picture-clip-dot right-top" on:pointerdown={ (e) => handlePointerDown(e, 'rt') }></div>
  <div class="mu-picture-clip-dot right" on:pointerdown={ (e) => handlePointerDown(e, 'r') }></div>
  <div class="mu-picture-clip-dot right-down" on:pointerdown={ (e) => handlePointerDown(e, 'rd') }></div>
  <div class="mu-picture-clip-dot down" on:pointerdown={ (e) => handlePointerDown(e, 'd') }></div>
  <div class="mu-picture-clip-dot left-down" on:pointerdown={ (e) => handlePointerDown(e, 'ld') }></div>
  <div class="mu-picture-clip-dot left" on:pointerdown={ (e) => handlePointerDown(e, 'l') }></div>
</div>

<script lang="ts">
  import type { Style } from './interface';

  let clipRef: HTMLElement;
  let clipStyle: Style = {
    left: '0px',
    top: '0px',
    width: '100px',
    height: '100px'
  };

  function handlePointerDown(event: PointerEvent, p?: string) {
    event.preventDefault()
    event.stopPropagation()
    document.onpointermove = (evt: PointerEvent) => {
      event.preventDefault()
      event.stopPropagation()
      // 获取需要改变尺寸元素到页面的距离
      // const rect = clipRef.getBoundingClientRect()
      const style = window.getComputedStyle ?  window.getComputedStyle(clipRef) : clipRef.currentStyle

      // 获取原始 left top width height
      const ox = parseFloat(style.left)
      const oy = parseFloat(style.top)

      const width = parseFloat(clipStyle.width)
      const height = parseFloat(clipStyle.height)

      // 获取鼠标位置，和元素初始offset进行对比，
      const chaX = evt.clientX - ox
      const chaY = evt.clientY - oy

      switch (p) {
        case 'lt':
          // 如果移动距离接近宽度或高度，则不进行改变
          if (chaX >= width - 10 || chaY >= height - 10) return

          // 获得位置差（m-e）,先设置宽度和高度，再设置位置
          // 原始宽高+(（m-e）*-1)，原始位置+（m-e）
          clipStyle.width = width + chaX * -1 + 'px'
          clipStyle.height = height + chaY * -1 + 'px'
          clipStyle.left = ox + chaX + 'px'
          clipStyle.top = oy + chaY + 'px'
          break
        case 't':
          // 如果移动距离接近宽度或高度，则不进行改变
          if (chaY >= height - 10) return

          // 获得位置差（m-e）,先设置宽度和高度，再设置位置
          // 原始宽高+(（m-e）*-1)，原始位置+（m-e）
          clipStyle.height = height + chaY * -1 + 'px'
          clipStyle.top = oy + chaY + 'px'
          break
        case 'rt':
          // 如果移动距离接近宽度或高度，则不进行改变
          if (chaX <= 10 || chaY >= height - 10) return

          // 获得位置差（m-e）,先设置宽度和高度，设置位置
          // 原始高+(（m-e）*-1),原始宽+(（m-e）)，原始位置+（m-e）
          clipStyle.width = chaX + 'px'
          clipStyle.height = height + chaY * -1 + 'px'
          clipStyle.top = oy + chaY + 'px'
          break
        case 'r':
          // 如果移动距离接近宽度或高度，则不进行改变
          if (chaX <= 10) return

          // 获得位置差（m-e）,先设置宽度和高度，再设置位置
          // 原始宽高+(（m-e）*-1)，原始位置+（m-e）
          clipStyle.width = chaX + 'px'
          break
        case 'rd':
          // 如果移动距离接近宽度或高度，则不进行改变
          if (chaX <= 10 || chaY <= 10) return

          // 获得位置差（m-e）,先设置宽度和高度，再设置位置
          // 原始宽高+(（m-e）*-1)，原始位置+（m-e）
          clipStyle.width = chaX + 'px'
          clipStyle.height = chaY + 'px'
          break
        case 'd':
          // 如果移动距离接近宽度或高度，则不进行改变
          if (chaY <= 10) return;

          // 获得位置差（m-e）,先设置宽度和高度，再设置位置
          // 原始宽高+(（m-e）*-1)，原始位置+（m-e）
          clipStyle.height = chaY + 'px'
          break
        case 'ld':
          // 如果移动距离接近宽度或高度，则不进行改变
          if (chaX >= width - 10 || chaY <= 10) return
          // 获得位置差（m-e）,先设置宽度和高度，再设置位置
          // 原始宽高+(（m-e）*-1)，原始位置+（m-e）
          clipStyle.width = width + chaX * -1 + 'px'
          clipStyle.height = chaY + 'px'
          clipStyle.left = ox + chaX + 'px'
          break
        case 'l':
          // 如果移动距离接近宽度或高度，则不进行改变
          if (chaX >= width - 10) return

          // 获得位置差（m-e）,先设置宽度和高度，再设置位置
          // 原始宽高+(（m-e）*-1)，原始位置+（m-e）
          clipStyle.width = width + chaX * -1 + 'px'
          clipStyle.left = ox + chaX + 'px'
          break
        default:
          // 如果按下位置不在点上，整体移动
          clipStyle.left = ox + chaX + 'px'
          clipStyle.top = oy + chaY + 'px'
          break
      }
    }
    document.onpointerup = onUp
    document.onpointercancel = onUp
  }
  function onUp() {
    document.onpointermove = null
    document.onpointerup = null
  }
</script>

<style>
  .mu-picture-clip {
    position: absolute;
    border: 1px solid #FFF;
    cursor: move;
    z-index: 9009;
    background-color: #333;
  }
  .mu-picture-clip-dot {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #FFF;
  }
  .mu-picture-clip-dot.left-top {
    top: -4px;
    left: -4px;
    cursor: nw-resize;
  }
  .mu-picture-clip-dot.top {
    top: -4px;
    left: 50%;
    margin-left: -4px;
    cursor: n-resize;
  }
  .mu-picture-clip-dot.right-top {
    top: -4px;
    right: -4px;
    cursor: ne-resize;
  }
  .mu-picture-clip-dot.right {
    top: 50%;
    margin-top: -4px;
    right: -4px;
    cursor: e-resize;
  }
  .mu-picture-clip-dot.right-down {
    bottom: -4px;
    right: -4px;
    cursor: se-resize;
  }
  .mu-picture-clip-dot.down {
    bottom: -4px;
    left: 50%;
    margin-left: -4px;
    cursor: s-resize;
  }
  .mu-picture-clip-dot.left-down {
    bottom: -4px;
    left: -4px;
    cursor: sw-resize;
  }
  .mu-picture-clip-dot.left {
    top: 50%;
    margin-top: -4px;
    left: -4px;
    cursor: w-resize;
  }
</style>