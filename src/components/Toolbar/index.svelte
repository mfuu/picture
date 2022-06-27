<section class="mu-picture__toolbar">
  {#each defaults as toolbar }
    <div class="mu-picture__toolbar-group">
      {#each toolbar as item }
        <button
          class="mu-picture__toolbar-icons"
          tooltip={ getToolbarInfo(item).tooltip }
          on:click={ handleToolbarClick }
        ></button>
      {/each}
    </div>
  {/each}
</section>

<script>
  import { createDefaultToolbarItemInfo } from './util.ts'
  let defaults = [['redo', 'undo'], ['text'], ['mosaic']]

  function getToolbarInfo(item) {
    return { ...createDefaultToolbarItemInfo(item) }
  }

  function handleToolbarClick(e) {
    console.log(e)
  }
</script>

<style>
  .mu-picture__toolbar {
    display: flex;
    padding: 0 25px;
    height: 45px;
    background-color: #f7f9fc;
    border-bottom: 1px solid #ebedf2;
    border-radius: 3px 3px 0 0;
  }
  .mu-picture__toolbar-group {
    display: flex;
    align-items: center;
  }
  .mu-picture__toolbar-group:not(:last-child)::after {
    content: '';
    height: 70%;
    width: 1px;
    margin: 0 10px;
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