<div style:top={ opStyle.top } style:bottom={ opStyle.bottom } class="mu-picture__clip-oprate">
  <button on:click={ handleCancel }>
    <span class="mu-picture__toolbar-icons mu-picture__toolbar-cancel"></span>
  </button>
  <button on:click={ handleOk }>
    <span class="mu-picture__toolbar-icons mu-picture__toolbar-ok"></span>
  </button>
</div>

<script lang="ts">
  import { storeToolbarClick } from '../../store/index';
  
  export let opStyle;

  function handleOk() {
    // 
  }
  function handleCancel() {
    storeToolbarClick.set({ name: 'clip' })
  }
</script>