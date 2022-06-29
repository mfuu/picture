<div class="mu-picture">
  <Toolbar />
  <div class="mu-picture__content">
    {#if visible }
      <Picker on:change={ handleFileChange } />
    {/if}
    <Canvas />
    <Clip />
  </div>
</div>

<script lang="ts">
  import { getImageUrl } from './utils/index';
  import Toolbar from './components/Toolbar/index.svelte';
  import Picker from './components/Picker/index.svelte';
  import Canvas from './components/Canvas/index.svelte';
  import Clip from './components/Clip/index.svelte';
  import { imageUrl } from './store/index';

  let visible: boolean = true;

  function handleFileChange(e: any) {
    const blob = e.detail[0]
    if (blob) imageUrl.set(getImageUrl(blob))
    // hide file picker
    visible = false
  }
</script>

<style>
  .mu-picture {
    position: relative;
    border: 1px solid #dadde6;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
  }
  .mu-picture__content {
    height: auto;
    min-height: 200px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>