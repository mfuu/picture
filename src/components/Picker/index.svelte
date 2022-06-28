<div class="mu-picture__picker">
  <input
    type="file"
    style="display: none;"
    bind:this={ inputRef }
    on:change={ handleFileChange }
  />
  <button on:click={ handleButtonClick }>选择文件</button>
</div>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  let inputRef: any;
  const dispatch = createEventDispatcher();

  function handleFileChange(e: any) {
    dispatch('change', e.target.files)
  }

  function handleButtonClick(e: any) {
    inputRef.click()
    e.preventDefault()
  }
</script>

<style>
  .mu-picture__picker button {
		line-height: 1.5715;
    position: relative;
    display: inline-block;
    font-weight: 400;
    white-space: nowrap;
    text-align: center;
    background-image: none;
    border: 1px solid transparent;
    box-shadow: 0 2px #00000004;
    cursor: pointer;
    transition: all .3s cubic-bezier(.645,.045,.355,1);
    user-select: none;
    touch-action: manipulation;
    height: 32px;
    padding: 4px 15px;
    margin: 6px 15px;
    font-size: 14px;
    border-radius: 2px;
    color: #000000d9;
    border-color: #d9d9d9;
    background: #fff;
  }
</style>