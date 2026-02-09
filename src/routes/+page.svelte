<script lang="ts">
	import GameBoard from '$lib/components/board/GameBoard.svelte';
	import LayoutSelector from '$lib/components/controls/LayoutSelector.svelte';
	import DeploymentSelector from '$lib/components/controls/DeploymentSelector.svelte';
	import UnitControls from '$lib/components/controls/UnitControls.svelte';
	import RayCastControls from '$lib/components/controls/RayCastControls.svelte';
</script>

<svelte:head>
	<title>Warhammer 40k Deployment Helper</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
	<!-- Header -->
	<header class="bg-gray-800 border-b border-gray-700 p-4">
		<div class="container mx-auto">
			<h1 class="text-2xl font-bold">⚔️ Warhammer 40k Deployment Helper</h1>
			<p class="text-sm text-gray-400 mt-1">
				Plan your deployment and analyze line of sight
			</p>
		</div>
	</header>

	<!-- Main content -->
	<div class="container mx-auto p-4">
		<div class="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
			<!-- Sidebar with controls -->
			<aside class="bg-gray-800 p-4 rounded-lg h-fit">
				<LayoutSelector />
				<hr class="border-gray-700 my-4" />
				<DeploymentSelector />
				<hr class="border-gray-700 my-4" />
				<UnitControls />
				<hr class="border-gray-700 my-4" />
				<RayCastControls />
			</aside>

			<!-- Game board -->
			<main class="flex justify-center items-start">
				<div class="inline-block">
					<GameBoard />
					<div class="mt-4 text-center text-sm text-gray-400">
						<p>60" × 44" board (1200×880 px @ 20px/inch)</p>
						<p class="mt-1">Drag units to position • Double-click to lock/unlock</p>
					</div>
				</div>
			</main>
		</div>
	</div>

	<!-- Footer -->
	<footer class="bg-gray-800 border-t border-gray-700 p-4 mt-8">
		<div class="container mx-auto text-center text-sm text-gray-400">
			<p>
				Open source deployment planner • Data from <a
					href="http://wahapedia.ru"
					class="text-blue-400 hover:underline"
					target="_blank">Wahapedia</a
				>
			</p>
		</div>
	</footer>
</div>
