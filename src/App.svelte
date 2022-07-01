<div class="mu-picture">
  <Toolbar />
  <div bind:this={ container } class="mu-picture__content mu-picture__bg">
    {#if pickerVisible }
      <Picker on:change={ handleFileChange } />
    {/if}
    {#if clipVisible }
      <Clip { container } />
    {/if}
    <Canvas />
  </div>
</div>

<script lang="ts">
  import Toolbar from './components/Toolbar/index.svelte';
  import Picker from './components/Picker/index.svelte';
  import Canvas from './components/Canvas/index.svelte';
  import Clip from './components/Clip/index.svelte';
  import type { toolbarInfo } from './components/Toolbar/interface'
  import { storeToolbarClick } from './store/index';

  let container: HTMLElement;
  let pickerVisible: boolean = true;
  let clipVisible: boolean = false;

  storeToolbarClick.subscribe((value: toolbarInfo) => {
    if (!value) return
    if (value.name === 'clip') {
      clipVisible = !clipVisible
    }
  })

  function handleFileChange(e: any) {
    // hide file picker
    pickerVisible = false
  }
</script>

<style>
  .mu-picture {
    position: relative;
    width: fit-content;
    border: 1px solid #dadde6;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .mu-picture__content {
    position: relative;
    height: auto;
    min-height: 200px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
</style>