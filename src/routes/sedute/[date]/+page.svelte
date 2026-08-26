<script lang="ts">
  import WorkoutApp from '../../+page.svelte';

  let { data } = $props();
</script>

<WorkoutApp {data} initialWorkoutDate={data.workoutDate} />
