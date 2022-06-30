<div style:height={ style.top <= 0 ? 0 : style.top + 'px' } class="mu-picture__clip-mask top"></div>
<div style:top={ style.top + 'px' } style:left={ style.left + style.width + 'px' } style:height={ style.height + 'px' } class="mu-picture__clip-mask right"></div>
<div style:top={ style.top + style.height + 'px' } class="mu-picture__clip-mask bottom"></div>
<div style:top={ style.top + 'px' } style:width={ style.left <= 0 ? 0 : style.left + 'px' } style:height={ style.height + 'px' } class="mu-picture__clip-mask left"></div>

<script>
  export let style;
</script>

<style>
  .mu-picture__clip-mask {
    position: absolute;
    background-color: #000;
    opacity: 0.5;
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