<script lang="ts">
	import { Layer } from 'svelte-konva';
	import { unitsStore } from '$lib/stores/units';
	import Unit from '../units/Unit.svelte';

	$: units = $unitsStore.units;
</script>

<Layer>
	{#each units as unit (unit.id)}
		<Unit {unit} />
	{/each}
</Layer>
