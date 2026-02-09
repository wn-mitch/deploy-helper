<script lang="ts">
	import { Layer, Rect } from 'svelte-konva';
	import { visibilityStore } from '$lib/stores/visibility';
	import { inchesToPixels } from '$lib/utils/coordinates';

	$: grid = $visibilityStore.visibilityGrid;

	// Color mapping for visibility zones
	const DANGER_COLOR = '#ef4444'; // red-500
	const SAFE_COLOR = '#10b981'; // green-500
	const ALPHA = 0.35;

	function getCellColor(zone: 'danger' | 'safe' | 'unanalyzed'): string {
		if (zone === 'danger') return DANGER_COLOR;
		if (zone === 'safe') return SAFE_COLOR;
		return 'transparent';
	}
</script>

{#if grid}
	<Layer>
		{#each grid.cells as row}
			{#each row as cell}
				{#if cell.zone !== 'unanalyzed'}
					<Rect
						config={{
							x: inchesToPixels(cell.centerPosition.x - grid.gridResolution / 2),
							y: inchesToPixels(cell.centerPosition.y - grid.gridResolution / 2),
							width: inchesToPixels(grid.gridResolution),
							height: inchesToPixels(grid.gridResolution),
							fill: getCellColor(cell.zone),
							opacity: ALPHA,
							listening: false // Don't interfere with dragging
						}}
					/>
				{/if}
			{/each}
		{/each}
	</Layer>
{/if}
