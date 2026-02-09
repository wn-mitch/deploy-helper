<script lang="ts">
	import type { Unit } from '$lib/types/units';
	import Base from './Base.svelte';

	export let unit: Unit;
</script>

<!-- Render all bases in this unit -->
{#each unit.bases as base (base.id)}
	<Base {base} {unit} />
{/each}
