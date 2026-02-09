<script lang="ts">
	import { onMount } from 'svelte';
	import Konva from 'konva';
	import {
		BOARD_WIDTH,
		BOARD_HEIGHT,
		PIXELS_PER_INCH,
		CANVAS_WIDTH,
		CANVAS_HEIGHT
	} from '$lib/utils/constants';
	import { inchesToPixels } from '$lib/utils/coordinates';
	import { terrainStore } from '$lib/stores/terrain';
	import { deploymentStore } from '$lib/stores/deployment';
	import { unitsStore } from '$lib/stores/units';
	import { visibilityStore } from '$lib/stores/visibility';
	import type { TerrainPiece, DeploymentZone } from '$lib/types/terrain';
	import type { Unit } from '$lib/types/units';
	import type { DeploymentZoneDefinition } from '$lib/types/deployment';
	import { getBaseDefinition } from '$lib/utils/units';

	let container: HTMLDivElement;
	let stage: Konva.Stage;
	let backgroundLayer: Konva.Layer;
	let deploymentLayer: Konva.Layer;
	let terrainLayer: Konva.Layer;
	let unitLayer: Konva.Layer;
	let visibilityLayer: Konva.Layer;

	onMount(() => {
		// Create Konva stage
		stage = new Konva.Stage({
			container: container,
			width: CANVAS_WIDTH,
			height: CANVAS_HEIGHT
		});

		// Create layers
		backgroundLayer = new Konva.Layer();
		deploymentLayer = new Konva.Layer();
		terrainLayer = new Konva.Layer();
		unitLayer = new Konva.Layer();
		visibilityLayer = new Konva.Layer();

		// Add layers to stage
		stage.add(backgroundLayer);
		stage.add(deploymentLayer);
		stage.add(terrainLayer);
		stage.add(unitLayer);
		stage.add(visibilityLayer);

		// Draw background
		drawBackground();

		// Subscribe to stores and redraw when they change
		const unsubTerrain = terrainStore.subscribe(($terrain) => {
			drawTerrain($terrain.currentLayout?.pieces || []);
		});

		const unsubDeployment = deploymentStore.subscribe(($deployment) => {
			drawDeploymentZones($deployment.currentPattern?.zones || []);
		});

		const unsubUnits = unitsStore.subscribe(($units) => {
			drawUnits($units.units);
		});

		const unsubVisibility = visibilityStore.subscribe(($visibility) => {
			drawVisibility($visibility.visibilityGrid);
		});

		return () => {
			unsubTerrain();
			unsubDeployment();
			unsubUnits();
			unsubVisibility();
			stage.destroy();
		};
	});

	function drawBackground() {
		backgroundLayer.destroyChildren();

		// Background rect
		const bg = new Konva.Rect({
			x: 0,
			y: 0,
			width: CANVAS_WIDTH,
			height: CANVAS_HEIGHT,
			fill: '#1f2937'
		});
		backgroundLayer.add(bg);

		// Minor grid lines (1" spacing)
		for (let i = 1; i < BOARD_WIDTH; i++) {
			const line = new Konva.Line({
				points: [inchesToPixels(i), 0, inchesToPixels(i), CANVAS_HEIGHT],
				stroke: '#4b5563',
				strokeWidth: 0.5,
				opacity: 0.2,
				listening: false
			});
			backgroundLayer.add(line);
		}

		for (let i = 1; i < BOARD_HEIGHT; i++) {
			const line = new Konva.Line({
				points: [0, inchesToPixels(i), CANVAS_WIDTH, inchesToPixels(i)],
				stroke: '#4b5563',
				strokeWidth: 0.5,
				opacity: 0.2,
				listening: false
			});
			backgroundLayer.add(line);
		}

		// Major grid lines (5" spacing)
		for (let i = 1; i < BOARD_WIDTH / 5; i++) {
			const line = new Konva.Line({
				points: [inchesToPixels(i * 5), 0, inchesToPixels(i * 5), CANVAS_HEIGHT],
				stroke: '#6b7280',
				strokeWidth: 1.5,
				opacity: 0.5,
				listening: false
			});
			backgroundLayer.add(line);
		}

		for (let i = 1; i < BOARD_HEIGHT / 5; i++) {
			const line = new Konva.Line({
				points: [0, inchesToPixels(i * 5), CANVAS_WIDTH, inchesToPixels(i * 5)],
				stroke: '#6b7280',
				strokeWidth: 1.5,
				opacity: 0.5,
				listening: false
			});
			backgroundLayer.add(line);
		}

		// Bold reference lines at 22" horizontal and 30" vertical
		const horizontalRefLine = new Konva.Line({
			points: [0, inchesToPixels(22), CANVAS_WIDTH, inchesToPixels(22)],
			stroke: '#fbbf24', // Amber color for visibility
			strokeWidth: 3,
			opacity: 0.8,
			listening: false
		});
		backgroundLayer.add(horizontalRefLine);

		const verticalRefLine = new Konva.Line({
			points: [inchesToPixels(30), 0, inchesToPixels(30), CANVAS_HEIGHT],
			stroke: '#fbbf24', // Amber color for visibility
			strokeWidth: 3,
			opacity: 0.8,
			listening: false
		});
		backgroundLayer.add(verticalRefLine);

		// Axis labels on top edge (every 5")
		for (let i = 0; i <= BOARD_WIDTH / 5; i++) {
			const label = new Konva.Text({
				x: inchesToPixels(i * 5),
				y: 4,
				text: `${i * 5}"`,
				fontSize: 10,
				fontFamily: 'monospace',
				fill: '#9ca3af',
				opacity: 0.7,
				offsetX: i === 0 ? 0 : 12, // Align left for 0", center for others
				listening: false
			});
			backgroundLayer.add(label);
		}

		// Axis labels on left edge (every 5")
		for (let i = 0; i <= BOARD_HEIGHT / 5; i++) {
			const label = new Konva.Text({
				x: 4,
				y: inchesToPixels(i * 5),
				text: `${i * 5}"`,
				fontSize: 10,
				fontFamily: 'monospace',
				fill: '#9ca3af',
				opacity: 0.7,
				offsetY: i === 0 ? 0 : 5, // Align top for 0", center for others
				listening: false
			});
			backgroundLayer.add(label);
		}

		backgroundLayer.batchDraw();
	}

	function drawDeploymentZones(zones: (DeploymentZone | DeploymentZoneDefinition)[]) {
		deploymentLayer.destroyChildren();

		zones.forEach((zone) => {
			if (zone.shape.type === 'rectangle') {
				// Draw filled zone with low opacity
				const fill = new Konva.Rect({
					x: inchesToPixels(zone.position.x),
					y: inchesToPixels(zone.position.y),
					width: inchesToPixels(zone.shape.width),
					height: inchesToPixels(zone.shape.height),
					fill: zone.color || '#3b82f6',
					opacity: 0.15,
					listening: false
				});
				deploymentLayer.add(fill);

				// Draw border with higher opacity and dashed line
				const border = new Konva.Rect({
					x: inchesToPixels(zone.position.x),
					y: inchesToPixels(zone.position.y),
					width: inchesToPixels(zone.shape.width),
					height: inchesToPixels(zone.shape.height),
					stroke: zone.color || '#3b82f6',
					strokeWidth: 3,
					opacity: 0.6,
					dash: [10, 5],
					listening: false
				});
				deploymentLayer.add(border);

				// Add zone label
				const label = new Konva.Text({
					x: inchesToPixels(zone.position.x + 2),
					y: inchesToPixels(zone.position.y + 1),
					text: zone.name,
					fontSize: 16,
					fontFamily: 'Arial',
					fill: zone.color || '#3b82f6',
					opacity: 0.8,
					listening: false
				});
				deploymentLayer.add(label);
			} else if (zone.shape.type === 'polygon') {
				// Convert polygon points to pixel coordinates
				const points = zone.shape.points.flatMap((p) => [
					inchesToPixels(zone.position.x + p.x),
					inchesToPixels(zone.position.y + p.y)
				]);

				// Draw filled polygon with low opacity
				const fill = new Konva.Line({
					points,
					fill: zone.color || '#3b82f6',
					opacity: 0.15,
					closed: true,
					listening: false
				});
				deploymentLayer.add(fill);

				// Draw border with higher opacity and dashed line
				const border = new Konva.Line({
					points,
					stroke: zone.color || '#3b82f6',
					strokeWidth: 3,
					opacity: 0.6,
					dash: [10, 5],
					closed: true,
					listening: false
				});
				deploymentLayer.add(border);

				// Calculate center point for label (average of all points)
				const centerX =
					zone.shape.points.reduce((sum, p) => sum + p.x, 0) / zone.shape.points.length;
				const centerY =
					zone.shape.points.reduce((sum, p) => sum + p.y, 0) / zone.shape.points.length;

				// Add zone label at center
				const label = new Konva.Text({
					x: inchesToPixels(zone.position.x + centerX),
					y: inchesToPixels(zone.position.y + centerY),
					text: zone.name,
					fontSize: 16,
					fontFamily: 'Arial',
					fill: zone.color || '#3b82f6',
					opacity: 0.8,
					offsetX: 30, // Center the text horizontally
					listening: false
				});
				deploymentLayer.add(label);
			}
		});

		deploymentLayer.batchDraw();
	}

	function drawTerrain(pieces: TerrainPiece[]) {
		terrainLayer.destroyChildren();

		pieces.forEach((piece) => {
			// Create a group to handle rotation and mirroring uniformly for all shapes
			const group = new Konva.Group({
				x: inchesToPixels(piece.position.x),
				y: inchesToPixels(piece.position.y),
				rotation: piece.rotation || 0,
				scaleX: piece.mirrored ? -1 : 1,
				listening: false
			});

			// Calculate center for debug label (use first shape which is the footprint)
			const footprint = piece.shapes[0];
			let localCenterX = 0;
			let localCenterY = 0;

			if (footprint.type === 'rectangle') {
				localCenterX = footprint.width / 2;
				localCenterY = footprint.height / 2;
			} else if (footprint.type === 'polygon') {
				localCenterX = footprint.points.reduce((sum, p) => sum + p.x, 0) / footprint.points.length;
				localCenterY = footprint.points.reduce((sum, p) => sum + p.y, 0) / footprint.points.length;
			}

			// Render each shape in the array
			piece.shapes.forEach((shape, index) => {
				const isFootprint = index === 0; // First shape is always the footprint

				if (shape.type === 'rectangle') {
					const fillColor = isFootprint ? '#6b7280' : '#8b7355'; // Gray for footprint, brown for terrain
					const strokeColor = isFootprint ? '#4b5563' : '#6b4423';
					const opacity = isFootprint ? 0.4 : 0.8;

					// Calculate position - footprints start at (0,0) in local coords, boxes need centering
					let rectX = 0;
					let rectY = 0;

					// Center non-footprint boxes within their footprint
					if (!isFootprint && footprint.type === 'rectangle') {
						const offsetX = (footprint.width - shape.width) / 2;
						const offsetY = (footprint.height - shape.height) / 2;
						rectX = offsetX;
						rectY = offsetY;
					}

					const rect = new Konva.Rect({
						x: inchesToPixels(rectX),
						y: inchesToPixels(rectY),
						width: inchesToPixels(shape.width),
						height: inchesToPixels(shape.height),
						fill: fillColor,
						stroke: strokeColor,
						strokeWidth: 2,
						opacity,
						listening: false
					});
					group.add(rect);
				} else if (shape.type === 'polygon') {
					const fillColor = isFootprint ? '#6b7280' : '#8b7355';
					const strokeColor = isFootprint ? '#4b5563' : '#6b4423';
					const opacity = isFootprint ? 0.4 : 0.8;

					const points = shape.points.flatMap((p) => [inchesToPixels(p.x), inchesToPixels(p.y)]);
					const polygon = new Konva.Line({
						points,
						fill: fillColor,
						stroke: strokeColor,
						strokeWidth: 2,
						opacity,
						closed: true,
						listening: false
					});
					group.add(polygon);
				} else if (shape.type === 'line') {
					// Lines render as stroked paths (ruin walls)
					const line = new Konva.Line({
						points: [
							inchesToPixels(shape.start.x),
							inchesToPixels(shape.start.y),
							inchesToPixels(shape.end.x),
							inchesToPixels(shape.end.y)
						],
						stroke: '#8b7355', // Brown for ruins
						strokeWidth: inchesToPixels(shape.thickness), // Convert thickness from inches to pixels
						lineCap: 'square',
						lineJoin: 'miter',
						opacity: 0.9,
						listening: false
					});
					group.add(line);
				}
			});

			// Debug: Add white dot at position corner (anchor point) - in group local coords
			const cornerDot = new Konva.Circle({
				x: 0,
				y: 0,
				radius: 4,
				fill: '#ffffff',
				stroke: '#000000',
				strokeWidth: 1,
				opacity: 1.0,
				listening: false
			});
			group.add(cornerDot);

			// Debug: Add piece ID label at center - in group local coords
			const label = new Konva.Text({
				x: inchesToPixels(localCenterX),
				y: inchesToPixels(localCenterY),
				text: piece.id,
				fontSize: 14,
				fontFamily: 'Arial',
				fill: '#ffffff',
				stroke: '#000000',
				strokeWidth: 0.5,
				opacity: 1.0,
				offsetY: 7,
				listening: false
			});

			// Center the text horizontally after creation
			label.offsetX(label.width() / 2);
			group.add(label);

			terrainLayer.add(group);
		});

		terrainLayer.batchDraw();
	}

	function drawUnits(units: Unit[]) {
		unitLayer.destroyChildren();

		units.forEach((unit) => {
			unit.bases.forEach((base) => {
				const baseDefinition = getBaseDefinition(base.size);
				const radiusPixels = inchesToPixels(baseDefinition.radiusInches);
				const fillColor = base.locked ? '#9ca3af' : unit.color || '#3b82f6';
				const strokeColor = base.locked ? '#6b7280' : '#1e40af';

				const circle = new Konva.Circle({
					x: inchesToPixels(base.position.x),
					y: inchesToPixels(base.position.y),
					radius: radiusPixels,
					fill: fillColor,
					stroke: strokeColor,
					strokeWidth: 2,
					opacity: base.locked ? 0.6 : 0.8,
					draggable: !base.locked,
					shadowBlur: base.locked ? 0 : 5,
					shadowColor: 'black',
					shadowOpacity: 0.3
				});

				// Only update store when drag ends (not during drag)
				// This prevents constant redraws that interfere with smooth dragging
				circle.on('dragend', () => {
					if (!base.locked) {
						const pos = circle.position();
						unitsStore.updateBasePosition(base.id, {
							x: pos.x / PIXELS_PER_INCH,
							y: pos.y / PIXELS_PER_INCH
						});
					}
				});

				// Handle double-click to lock/unlock
				circle.on('dblclick', () => {
					unitsStore.toggleBaseLock(base.id);
				});

				unitLayer.add(circle);
			});
		});

		unitLayer.batchDraw();
	}

	function drawVisibility(grid: any) {
		visibilityLayer.destroyChildren();

		if (!grid) {
			visibilityLayer.batchDraw();
			return;
		}

		const DANGER_COLOR = '#ef4444';
		const SAFE_COLOR = '#10b981';
		const ALPHA = 0.35;

		grid.cells.forEach((row: any[]) => {
			row.forEach((cell: any) => {
				if (cell.zone !== 'unanalyzed') {
					const color = cell.zone === 'danger' ? DANGER_COLOR : SAFE_COLOR;
					const rect = new Konva.Rect({
						x: inchesToPixels(cell.centerPosition.x - grid.gridResolution / 2),
						y: inchesToPixels(cell.centerPosition.y - grid.gridResolution / 2),
						width: inchesToPixels(grid.gridResolution),
						height: inchesToPixels(grid.gridResolution),
						fill: color,
						opacity: ALPHA,
						listening: false
					});
					visibilityLayer.add(rect);
				}
			});
		});

		visibilityLayer.batchDraw();
	}
</script>

<div class="border-2 border-gray-700 inline-block bg-gray-900">
	<div bind:this={container}></div>
</div>
