<script lang="ts">
	import { Rect, Line } from 'svelte-konva';
	import { inchesToPixels } from '$lib/utils/coordinates';
	import type { TerrainPiece } from '$lib/types/terrain';

	export let piece: TerrainPiece;

	// Color coding: blocking terrain is darker, non-blocking is lighter
	$: fillColor = piece.blocking ? '#6b7280' : '#9ca3af'; // gray-500 : gray-400
	$: strokeColor = piece.blocking ? '#4b5563' : '#6b7280'; // gray-600 : gray-500

	// Height visual indicator (darker = taller)
	$: opacity = piece.height && piece.height > 4 ? 0.9 : 0.7;

	function getRectConfig() {
		if (piece.shape.type !== 'rectangle') return null;

		return {
			x: inchesToPixels(piece.position.x),
			y: inchesToPixels(piece.position.y),
			width: inchesToPixels(piece.shape.width),
			height: inchesToPixels(piece.shape.height),
			fill: fillColor,
			stroke: strokeColor,
			strokeWidth: 2,
			opacity,
			rotation: piece.rotation || 0
		};
	}

	function getPolygonConfig() {
		if (piece.shape.type !== 'polygon') return null;

		// Convert points to flat array of coordinates for Konva
		const points = piece.shape.points.flatMap((p) => [
			inchesToPixels(piece.position.x + p.x),
			inchesToPixels(piece.position.y + p.y)
		]);

		return {
			points,
			fill: fillColor,
			stroke: strokeColor,
			strokeWidth: 2,
			opacity,
			closed: true,
			rotation: piece.rotation || 0
		};
	}
</script>

{#if piece.shape.type === 'rectangle'}
	{@const config = getRectConfig()}
	{#if config}
		<Rect {config} />
	{/if}
{:else if piece.shape.type === 'polygon'}
	{@const config = getPolygonConfig()}
	{#if config}
		<Line {config} />
	{/if}
{/if}
