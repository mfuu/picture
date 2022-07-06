<div class="mu-picture__toolbar">
  <!-- toolbar -->
  {#each toolbars as toolbar }
    <div class="mu-picture__toolbar-group">
      {#each toolbar as item }
        <button tooltip={ item.tooltip } on:click={ () => handleToolbarClick(item) } >
          <span class={`mu-picture__toolbar-icons mu-picture__toolbar-${item.className}`}></span>
        </button>
      {/each}
    </div>
  {/each}
  <!-- file picker -->
  <div class="mu-picture__picker">
    <input
      type="file"
      style="display: none;"
      bind:this={ inputRef }
      on:change={ handleFileChange }
    />
    <button tooltip={ '选择文件' } on:click={ handleButtonClick }>
      <span class="mu-picture__toolbar-icons mu-picture__toolbar-local"></span>
    </button>
  </div>
</div>

<script lang="ts">
  import { getImageUrl } from '../../utils/index';
  import { createEventDispatcher } from 'svelte';
  import { storeImageUrl } from '../../store/index';
  import { createDefaultToolbarItemInfo } from './util';
  import type { toolbarInfo } from './interface';
  import { storeToolbarClick } from '../../store/index';

  let toolbars: Array<any> = [];
  let inputRef: any;
  const dispatch = createEventDispatcher();
  const defaults = [['undo', 'redo'], ['text', 'mosaic', 'clip']];


  $: {
    defaults.forEach((group, index) => {
      group.forEach(item => {
        if (!toolbars[index]) toolbars[index] = []
        toolbars[index].push({ ...createDefaultToolbarItemInfo(item) })
      })
    })
  }

  function handleFileChange(e: any) {
    const blob = e.target.files[0]
    if (blob) storeImageUrl.set(getImageUrl(blob))
    dispatch('change', e.target.files)
  }

  function handleButtonClick(e: any) {
    inputRef.click()
    e.preventDefault()
  }

  function handleToolbarClick(item: toolbarInfo) {
    storeToolbarClick.set(item)
  }
</script>

<style>
  .mu-picture__toolbar {
    display: flex;
    height: 45px;
    padding: 0 25px 0 10px;
    background-color: #f7f9fc;
    border-bottom: 1px solid #ebedf2;
    border-radius: 3px 3px 0 0;
  }
  .mu-picture__toolbar-group {
    display: flex;
    align-items: center;
  }
  .mu-picture__toolbar-group::after {
    content: '';
    height: 55%;
    width: 1px;
    margin: 0 12px;
    background-color: #e1e3e9;
  }
</style>