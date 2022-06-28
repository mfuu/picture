<canvas bind:this={ canvas } width="0" height="0">

</canvas>

<script lang="ts">
  import { onMount } from "svelte";

  export let url: string;

  let canvas: any;
  let context: any;
  let image = new Image();

  onMount(() => {
    context = canvas.getContext('2d');
  })

  $: {
    image.src = url
    image.onload = () => {
      const { width, height } = image
      canvas.width = width
      canvas.height = height
      context.drawImage(image, 0, 0, width, height)
    }
  }
</script>

<style>

</style>