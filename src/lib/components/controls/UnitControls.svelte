<script lang="ts">
	import { unitsStore } from '$lib/stores/units';
	import { getAllBaseSizes } from '$lib/utils/units';
	import type { BaseSize } from '$lib/types/units';
	import { BOARD_WIDTH, BOARD_HEIGHT } from '$lib/utils/constants';

	const baseSizes = getAllBaseSizes();

	// Form state
	let unitName = 'John Battlemallet';
	let selectedBaseSize: BaseSize = 32;
	let baseCount = 1;
	let unitColor = '#3b82f6';

	$: units = $unitsStore.units;

	function handleAddUnit() {
		if (!unitName.trim()) {
			alert('Please enter a unit name');
			return;
		}

		if (baseCount < 1 || baseCount > 20) {
			alert('Base count must be between 1 and 20');
			return;
		}

		// Place unit in center of board
		const centerPosition = {
			x: BOARD_WIDTH / 2 - baseCount,
			y: BOARD_HEIGHT / 2
		};

		unitsStore.createUnit(unitName, selectedBaseSize, baseCount, centerPosition, unitColor);

		// Reset form
		unitName = 'John Battlemallet';
		baseCount = 1;
	}

	function handleRemoveUnit(unitId: string) {
		unitsStore.removeUnit(unitId);
	}

	function handleClearAll() {
		unitsStore.clear();
	}
</script>

<div class="mb-6">
	<h3 class="text-lg font-semibold text-white mb-3">Units</h3>

	<!-- Add unit form -->
	<div class="bg-gray-700 p-4 rounded-lg mb-4">
		<div class="mb-3">
			<label for="unit-name" class="block text-sm font-medium text-gray-300 mb-1">
				Unit Name
			</label>
			<input
				id="unit-name"
				type="text"
				bind:value={unitName}
				placeholder="John Battlemallet"
				class="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="grid grid-cols-2 gap-3 mb-3">
			<div>
				<label for="base-size" class="block text-sm font-medium text-gray-300 mb-1">
					Base Size (mm)
				</label>
				<select
					id="base-size"
					bind:value={selectedBaseSize}
					class="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each baseSizes as base}
						<option value={base.size}>{base.size}mm</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="base-count" class="block text-sm font-medium text-gray-300 mb-1">
					Model Count
				</label>
				<input
					id="base-count"
					type="number"
					bind:value={baseCount}
					min="1"
					max="20"
					class="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="mb-3">
			<label for="unit-color" class="block text-sm font-medium text-gray-300 mb-1">
				Color
			</label>
			<input
				id="unit-color"
				type="color"
				bind:value={unitColor}
				class="w-full h-10 bg-gray-600 border border-gray-500 rounded-md cursor-pointer"
			/>
		</div>

		<button
			on:click={handleAddUnit}
			class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
		>
			Add Unit
		</button>
	</div>

	<!-- Units list -->
	{#if units.length > 0}
		<div class="space-y-2">
			<div class="flex justify-between items-center mb-2">
				<h4 class="text-sm font-medium text-gray-300">
					{units.length} unit{units.length !== 1 ? 's' : ''} on board
				</h4>
				<button
					on:click={handleClearAll}
					class="text-xs text-red-400 hover:text-red-300 transition"
				>
					Clear All
				</button>
			</div>
			{#each units as unit (unit.id)}
				<div class="flex items-center justify-between bg-gray-700 p-2 rounded">
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 rounded-full" style="background-color: {unit.color}"></div>
						<span class="text-sm text-white">{unit.name}</span>
						<span class="text-xs text-gray-400">({unit.bases.length} models)</span>
					</div>
					<button
						on:click={() => handleRemoveUnit(unit.id)}
						class="text-red-400 hover:text-red-300 text-sm transition"
					>
						Remove
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-gray-400 text-center py-4">No units yet</p>
	{/if}

	<div class="mt-4 text-xs text-gray-400">
		<p>💡 Double-click bases to lock/unlock them</p>
	</div>
</div>
