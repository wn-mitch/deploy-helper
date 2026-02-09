<script lang="ts">
	import { visibilityStore } from '$lib/stores/visibility';
	import { selectionStore } from '$lib/stores/selection';
	import { terrainStore } from '$lib/stores/terrain';
	import { deploymentStore } from '$lib/stores/deployment';
	import {
		DEFAULT_GRID_RESOLUTION,
		MIN_GRID_RESOLUTION,
		MAX_GRID_RESOLUTION
	} from '$lib/utils/constants';
	import {
		generateVisibilityMap,
		sampleZonePoints,
		calculateVisibilityStats
	} from '$lib/utils/raycasting/visibility-map';

	let gridResolution = DEFAULT_GRID_RESOLUTION;
	let sourceMode: 'opponent' | 'unit' | 'custom' = 'opponent';

	$: isAnalyzing = $visibilityStore.isAnalyzing;
	$: progress = $visibilityStore.progress;
	$: stats = $visibilityStore.stats;
	$: hasVisibility = $visibilityStore.visibilityGrid !== null;
	$: currentLayout = $terrainStore.currentLayout;

	// Get deployment zones from deploymentStore
	$: deploymentZones = $deploymentStore.currentPattern?.zones || [];

	// Find opponent zone (defender)
	$: opponentZone = deploymentZones.find((z) => z.player === 'defender');

	async function handleAnalyze() {
		if (!currentLayout) {
			alert('Please select a terrain layout first');
			return;
		}

		if (!opponentZone) {
			alert('No opponent deployment zone defined in this layout');
			return;
		}

		try {
			visibilityStore.setAnalyzing(true);
			visibilityStore.updateProgress(0);

			// Sample source points from opponent deployment zone
			const sourcePoints = sampleZonePoints(opponentZone, 4); // 4" spacing

			// Generate visibility map
			// Use setTimeout to allow UI to update
			setTimeout(() => {
				const grid = generateVisibilityMap(
					sourcePoints,
					currentLayout.pieces,
					gridResolution,
					(progress) => {
						visibilityStore.updateProgress(progress);
					}
				);

				// Calculate statistics
				const stats = calculateVisibilityStats(grid);

				// Update store
				visibilityStore.setGrid(grid);
				visibilityStore.setStats(stats);
				visibilityStore.setAnalyzing(false);
			}, 100);
		} catch (error) {
			console.error('Visibility analysis failed:', error);
			alert('Failed to analyze visibility: ' + (error as Error).message);
			visibilityStore.setAnalyzing(false);
		}
	}

	function handleClear() {
		visibilityStore.clear();
		selectionStore.clear();
	}
</script>

<div class="mb-6">
	<h3 class="text-lg font-semibold text-white mb-3">Visibility Analysis</h3>

	{#if !currentLayout}
		<p class="text-sm text-gray-400 mb-4">Select a terrain layout to begin</p>
	{:else}
		<div class="bg-gray-700 p-4 rounded-lg space-y-4">
			<!-- Source selection -->
			<div>
				<fieldset>
					<legend class="block text-sm font-medium text-gray-300 mb-2">
						Analyze visibility from:
					</legend>
				<div class="space-y-2">
					<label class="flex items-center">
						<input
							type="radio"
							bind:group={sourceMode}
							value="opponent"
							class="mr-2"
							disabled={!opponentZone}
						/>
						<span class="text-sm text-white">Opponent Deployment Zone</span>
					</label>
					<label class="flex items-center">
						<input type="radio" bind:group={sourceMode} value="unit" class="mr-2" disabled />
						<span class="text-sm text-gray-400">Selected Unit (coming soon)</span>
					</label>
					<label class="flex items-center">
						<input type="radio" bind:group={sourceMode} value="custom" class="mr-2" disabled />
						<span class="text-sm text-gray-400">Custom Points (coming soon)</span>
					</label>
				</div>
				</fieldset>
			</div>

			<!-- Grid resolution -->
			<div>
				<label for="grid-resolution" class="block text-sm font-medium text-gray-300 mb-2">
					Analysis Detail: {gridResolution}" grid
				</label>
				<input
					id="grid-resolution"
					type="range"
					bind:value={gridResolution}
					min={MIN_GRID_RESOLUTION}
					max={MAX_GRID_RESOLUTION}
					step="0.5"
					class="w-full"
					disabled={isAnalyzing}
				/>
				<div class="flex justify-between text-xs text-gray-400 mt-1">
					<span>High detail (slower)</span>
					<span>Low detail (faster)</span>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="space-y-2">
				<button
					on:click={handleAnalyze}
					disabled={isAnalyzing || !opponentZone}
					class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition"
				>
					{#if isAnalyzing}
						Analyzing... {Math.round(progress)}%
					{:else}
						Analyze Visibility
					{/if}
				</button>

				{#if hasVisibility}
					<button
						on:click={handleClear}
						class="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-md transition"
					>
						Clear Analysis
					</button>
				{/if}
			</div>

			<!-- Progress bar -->
			{#if isAnalyzing}
				<div class="w-full bg-gray-600 rounded-full h-2">
					<div
						class="bg-green-500 h-2 rounded-full transition-all duration-300"
						style="width: {progress}%"
					></div>
				</div>
			{/if}

			<!-- Results -->
			{#if stats}
				<div class="bg-gray-800 p-3 rounded space-y-2">
					<h4 class="text-sm font-semibold text-white">Results</h4>
					<div class="grid grid-cols-2 gap-2 text-sm">
						<div>
							<span class="text-red-400">● Danger zones:</span>
							<span class="text-white font-medium">{stats.dangerPercentage.toFixed(1)}%</span>
						</div>
						<div>
							<span class="text-green-400">● Safe zones:</span>
							<span class="text-white font-medium">{stats.safePercentage.toFixed(1)}%</span>
						</div>
					</div>
					<p class="text-xs text-gray-400 mt-2">
						{stats.totalCells} cells analyzed ({stats.dangerCells} exposed, {stats.safeCells} hidden)
					</p>
				</div>
			{/if}

			<!-- Instructions -->
			<div class="text-xs text-gray-400 space-y-1">
				<p>🔴 Red = Visible from opponent (danger zone)</p>
				<p>🟢 Green = Hidden from opponent (safe zone)</p>
			</div>
		</div>
	{/if}
</div>
