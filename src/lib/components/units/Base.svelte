<script lang="ts">
	import { Circle } from 'svelte-konva';
	import { unitsStore } from '$lib/stores/units';
	import { inchesToPixels, pixelsToInches } from '$lib/utils/coordinates';
	import { getBaseDefinition } from '$lib/utils/units';
	import type { Base, Unit } from '$lib/types/units';

	export let base: Base;
	export let unit: Unit;

	// Get base radius
	$: baseDefinition = getBaseDefinition(base.size);
	$: radiusPixels = inchesToPixels(baseDefinition.radiusInches);

	// Position in pixels
	$: xPixels = inchesToPixels(base.position.x);
	$: yPixels = inchesToPixels(base.position.y);

	// Visual styling
	$: fillColor = base.locked ? '#9ca3af' : unit.color || '#3b82f6';
	$: strokeColor = base.locked ? '#6b7280' : '#1e40af';

	function handleDragMove(e: any) {
		if (!base.locked) {
			const stage = e.target.getStage();
			const position = e.target.position();

			// Convert back to inches
			unitsStore.updateBasePosition(base.id, {
				x: pixelsToInches(position.x),
				y: pixelsToInches(position.y)
			});
		}
	}

	function handleDragEnd(e: any) {
		// Could add snap-to-grid here
	}

	function handleClick() {
		// Double-click to lock/unlock
		unitsStore.toggleBaseLock(base.id);
	}
</script>

<Circle
	config={{
		x: xPixels,
		y: yPixels,
		radius: radiusPixels,
		fill: fillColor,
		stroke: strokeColor,
		strokeWidth: 2,
		draggable: !base.locked,
		opacity: base.locked ? 0.6 : 0.8,
		shadowBlur: base.locked ? 0 : 5,
		shadowColor: 'black',
		shadowOpacity: 0.3,
		on: {
			dragmove: handleDragMove,
			dragend: handleDragEnd,
			dblclick: handleClick
		}
	}}
/>
