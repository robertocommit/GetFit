<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>GetFit · Il tuo piano</title>
  <meta name="description" content="Programma di allenamento personale di 5 mesi." />
</svelte:head>

{@render children()}
