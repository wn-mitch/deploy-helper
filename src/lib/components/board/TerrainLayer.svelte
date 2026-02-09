<script lang="ts">
	import { Layer } from 'svelte-konva';
	import { terrainStore } from '$lib/stores/terrain';
	import TerrainPiece from '../terrain/TerrainPiece.svelte';

	// Subscribe to terrain store
	$: pieces = $terrainStore.currentLayout?.pieces || [];
</script>

<Layer>
	{#each pieces as piece (piece.id)}
		<TerrainPiece {piece} />
	{/each}
</Layer>
