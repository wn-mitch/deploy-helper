<script lang="ts">
	import { Layer, Rect, Line } from 'svelte-konva';
	import { terrainStore } from '$lib/stores/terrain';
	import { inchesToPixels } from '$lib/utils/coordinates';
	import type { DeploymentZone } from '$lib/types/terrain';

	$: deploymentZones = $terrainStore.currentLayout?.deploymentZones || [];

	function getShapeConfig(zone: DeploymentZone) {
		const baseConfig = {
			stroke: zone.color || '#3b82f6',
			strokeWidth: 2,
			opacity: 0.3,
			dash: [10, 5]
		};

		if (zone.shape.type === 'rectangle') {
			return {
				...baseConfig,
				x: inchesToPixels(zone.position.x),
				y: inchesToPixels(zone.position.y),
				width: inchesToPixels(zone.shape.width),
				height: inchesToPixels(zone.shape.height),
				fill: zone.color || '#3b82f6',
				fillEnabled: true
			};
		}

		// Polygon shape - not needed for MVP but prepared for future
		return baseConfig;
	}
</script>

<Layer>
	{#each deploymentZones as zone (zone.name)}
		{#if zone.shape.type === 'rectangle'}
			<Rect config={getShapeConfig(zone)} />
		{/if}
	{/each}
</Layer>
