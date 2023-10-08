<script lang="ts">
  export let grade: number = 0;
  export let weight: number = 0;
  let edit = false;
</script>

<div class="grade-container">
  <span class="grade-value">{grade}</span>
  <span class="grade-weight">{weight}</span>
  <button class="grade-settings">...</button>
</div>