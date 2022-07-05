<div class="mu-picture__toolbar">
  <!-- file picker -->
  <Picker />
  <!-- toolbar -->
  {#each toolbars as toolbar }
    <div class="mu-picture__toolbar-group">
      {#each toolbar as item }
        <button
          class={`mu-picture__toolbar-icons ${item.className}`}
          tooltip={ item.tooltip }
          on:click={ () => handleToolbarClick(item) }
        ></button>
      {/each}
    </div>
  {/each}
</div>

<script lang="ts">
  import Picker from '../../components/Picker/index.svelte';
  import { createDefaultToolbarItemInfo } from './util';
  import type { toolbarInfo } from './interface';
  import { storeToolbarClick } from '../../store/index';

  const defaults = [['undo', 'redo'], ['text'], ['mosaic'], ['clip']];

  let toolbars: Array<any> = [];

  $: {
    defaults.forEach((group, index) => {
      group.forEach(item => {
        if (!toolbars[index]) toolbars[index] = []
        toolbars[index].push({ ...createDefaultToolbarItemInfo(item) })
      })
    })
  }

  function handleToolbarClick(item: toolbarInfo) {
    storeToolbarClick.set(item)
  }
</script>

<style>
  .mu-picture__toolbar {
    display: flex;
    height: 45px;
    padding-right: 25px;
    background-color: #f7f9fc;
    border-bottom: 1px solid #ebedf2;
    border-radius: 3px 3px 0 0;
  }
  .mu-picture__toolbar-group {
    display: flex;
    align-items: center;
  }
  .mu-picture__toolbar-group::before {
    content: '';
    height: 70%;
    width: 1px;
    margin: 0 10px;
    background-color: #eee;
  }
  .mu-picture__toolbar button {
    box-sizing: border-box;
    cursor: pointer;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 3px;
    margin: 7px 5px;
    border: 1px solid #f7f9fc;
  }
  .mu-picture__toolbar button:hover {
    border: 1px solid #e4e7ee;
    background-color: #fff;
  }
</style>