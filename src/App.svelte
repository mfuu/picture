<div class="mu-picture">
  <Toolbar />
  <div bind:this={ container } class="mu-picture__content mu-picture__bg">
    <Canvas />
    <!-- clip box -->
    {#if clipVisible }
      <Clip { container } />
    {/if}
  </div>
</div>

<script lang="ts">
  import Toolbar from './components/Toolbar/index.svelte';
  import Canvas from './components/Canvas/index.svelte';
  import Clip from './components/Clip/index.svelte';
  import type { toolbarInfo } from './components/Toolbar/interface'
  import { storeToolbarClick } from './store/index';

  let container: HTMLElement;
  let clipVisible: boolean = false;

  storeToolbarClick.subscribe((value: toolbarInfo) => {
    if (!value) return
    if (value.name === 'clip') {
      clipVisible = !clipVisible
    }
  })
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
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
</style>