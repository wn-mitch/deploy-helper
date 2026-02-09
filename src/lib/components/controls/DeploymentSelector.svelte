<script lang="ts">
	import { onMount } from 'svelte';
	import { deploymentStore } from '$lib/stores/deployment';

	const AVAILABLE_PATTERNS = [
		{ id: 'tipping-point', name: 'Tipping Point' },
		{ id: 'hammer-and-anvil', name: 'Hammer and Anvil' },
		{ id: 'sweeping-engagement', name: 'Sweeping Engagement' },
		{ id: 'dawn-of-war', name: 'Dawn of War' },
		{ id: 'crucible-of-battle', name: 'Crucible of Battle' },
		{ id: 'search-and-destroy', name: 'Search and Destroy' }
	];

	let selectedPatternId = 'tipping-point';

	onMount(() => {
		// Load Tipping Point by default
		deploymentStore.loadPattern('tipping-point');
	});

	function handlePatternChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const patternId = target.value;
		deploymentStore.loadPattern(patternId);
	}
</script>

<div class="mb-4">
	<label for="deployment-select" class="block text-sm font-medium text-gray-300 mb-2">
		Deployment Pattern
	</label>
	<select
		id="deployment-select"
		bind:value={selectedPatternId}
		on:change={handlePatternChange}
		class="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
	>
		{#each AVAILABLE_PATTERNS as pattern}
			<option value={pattern.id}>{pattern.name}</option>
		{/each}
	</select>
</div>
