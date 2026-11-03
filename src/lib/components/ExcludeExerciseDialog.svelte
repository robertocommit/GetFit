<script lang="ts">
  let { name, onconfirm, oncancel }: { name: string; onconfirm: () => void; oncancel: () => void } = $props();
  let dialog: HTMLDialogElement;
  let cancelButton: HTMLButtonElement;
  $effect(() => {
    const element = dialog;
    element.showModal();
    cancelButton.focus();
    return () => element.close();
  });
</script>
<dialog bind:this={dialog} aria-labelledby="exclude-exercise-title" aria-describedby="exclude-exercise-description" class="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-[1.75rem] border border-black/[0.06] bg-white p-5 text-ink shadow-card backdrop:bg-black/35" oncancel={event => { event.preventDefault(); oncancel(); }}>
  <h2 id="exclude-exercise-title" class="text-xl font-bold">Escludere {name}?</h2>
  <p id="exclude-exercise-description" class="mt-3 text-sm leading-6 text-muted">Le serie di questo esercizio saranno segnate come escluse e non conteranno come svolte in questa seduta. Potrai ripristinare l’esercizio.</p>
  <div class="mt-5 grid grid-cols-2 gap-3">
    <button bind:this={cancelButton} type="button" class="min-h-11 rounded-xl bg-cream px-3 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss" onclick={oncancel}>Annulla</button>
    <button type="button" class="min-h-11 rounded-xl bg-ink px-3 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss" onclick={onconfirm}>Escludi esercizio</button>
  </div>
</dialog>
