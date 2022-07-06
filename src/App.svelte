<div class="mu-picture">
  <Toolbar />
  <div class="mu-picture__content">
    <div bind:this={ container } class="mu-picture__content-edit">
      <Edit />
      <!-- clip box -->
      {#if clipVisible }
        <Clip { container } />
      {/if}
    </div>
    <div class="mu-picture__content-preview"></div>
  </div>
</div>

<script lang="ts">
  import Toolbar from './components/Toolbar/index.svelte';
  import Edit from './components/Edit/index.svelte';
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