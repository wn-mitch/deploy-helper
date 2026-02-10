<script lang="ts">
    import { onMount } from "svelte";
    import Konva from "konva";
    import type { TerrainPiece, Point } from "$lib/types/terrain";
    import { inchesToPixels } from "$lib/utils/coordinates";
    import { PIXELS_PER_INCH } from "$lib/utils/constants";
    import { isRayBlocked, isRayBlockedSelective, bresenham } from "$lib/utils/raycasting/bresenham";
    import {
        createCollisionSystem,
        pointIntersectsTerrain,
        createTerrainCollisionSystems,
        pointIntersectsTerrainSelective,
    } from "$lib/utils/collision/detector";
    import { getTerrainOccupancy } from "$lib/utils/collision/occupancy";

    // ============================================================================
    // TypeScript Interfaces
    // ============================================================================

    interface TestScenario {
        id: string;
        name: string;
        description: string;
        boardSize: { width: number; height: number }; // Inches
        terrain: TerrainPiece[];
        testUnit: {
            name: string;
            baseSize: number; // mm diameter
            position: Point; // inches
            color: string;
        };
        raySource: {
            type: "edge";
            points: Point[]; // Pre-defined source points
        };
        expectedResult: "visible" | "safe";
        notes: string;
    }

    interface AnalysisResult {
        result: "visible" | "safe";
        totalRays: number;
        blockedCount: number;
        clearCount: number;
        matchesExpected: boolean;
        rayResults: Array<{ source: Point; target: Point; blocked: boolean }>;
    }

    // ============================================================================
    // Test Scenarios
    // ============================================================================

    const scenarios: TestScenario[] = [
        {
            id: "scenario-1",
            name: "Empty Board",
            description: "Control test - no terrain blocking line of sight",
            boardSize: { width: 30, height: 20 },
            terrain: [],
            testUnit: {
                name: "Test Unit",
                baseSize: 32,
                position: { x: 15, y: 10 },
                color: "#3b82f6",
            },
            raySource: {
                type: "edge",
                points: [
                    { x: 6, y: 0 },
                    { x: 10, y: 0 },
                    { x: 15, y: 0 },
                    { x: 20, y: 0 },
                    { x: 24, y: 0 },
                ],
            },
            expectedResult: "visible",
            notes: "All rays should be clear - baseline test",
        },
        {
            id: "scenario-2",
            name: "Unit Behind Ruin",
            description:
                "Full occlusion - unit completely hidden by blocking terrain",
            boardSize: { width: 30, height: 20 },
            terrain: [
                {
                    id: "ruin-1",
                    shapes: [{ type: "rectangle", width: 12, height: 6 }],
                    position: { x: 9, y: 4 },
                    blocking: true,
                    height: 5,
                },
            ],
            testUnit: {
                name: "Test Unit",
                baseSize: 32,
                position: { x: 15, y: 14 },
                color: "#3b82f6",
            },
            raySource: {
                type: "edge",
                points: [
                    { x: 6, y: 0 },
                    { x: 10, y: 0 },
                    { x: 15, y: 0 },
                    { x: 20, y: 0 },
                    { x: 24, y: 0 },
                ],
            },
            expectedResult: "safe",
            notes: "All rays should be blocked by the ruin",
        },
        {
            id: "scenario-3",
            name: "Partial Cover",
            description: "Some rays blocked, some clear - unit is visible",
            boardSize: { width: 30, height: 20 },
            terrain: [
                {
                    id: "wall-1",
                    shapes: [{ type: "rectangle", width: 3, height: 2 }],
                    position: { x: 13.5, y: 6 },
                    blocking: true,
                    height: 5,
                },
            ],
            testUnit: {
                name: "Test Unit",
                baseSize: 32,
                position: { x: 15, y: 10 },
                color: "#3b82f6",
            },
            raySource: {
                type: "edge",
                points: [
                    { x: 6, y: 0 },
                    { x: 10, y: 0 },
                    { x: 15, y: 0 },
                    { x: 20, y: 0 },
                    { x: 24, y: 0 },
                ],
            },
            expectedResult: "visible",
            notes: "At least one ray should be clear - unit is exposed",
        },
        {
            id: "scenario-4",
            name: "Model ON Terrain",
            description: "Model standing on terrain footprint - should be visible through footprint",
            boardSize: { width: 30, height: 20 },
            terrain: [
                {
                    id: "ruin-1",
                    shapes: [
                        { type: "rectangle", width: 10, height: 6 }  // Footprint only, no walls
                    ],
                    position: { x: 10, y: 7 },
                    blocking: true,
                    height: 5,
                },
            ],
            testUnit: {
                name: "Test Unit",
                baseSize: 32,
                position: { x: 15, y: 10 },  // Center of footprint
                color: "#3b82f6",
            },
            raySource: {
                type: "edge",
                points: [
                    { x: 15, y: 0 },   // Directly across footprint
                    { x: 10, y: 0 },
                    { x: 20, y: 0 },
                ],
            },
            expectedResult: "visible",
            notes: "Model on footprint can be seen through that footprint",
        },
        {
            id: "scenario-5",
            name: "Model ON Terrain Behind Wall",
            description: "Model on footprint but walls block LOS",
            boardSize: { width: 30, height: 20 },
            terrain: [
                {
                    id: "ruin-1",
                    shapes: [
                        { type: "rectangle", width: 10, height: 6 },  // Footprint
                        {
                            type: "line",  // Wall blocking rays
                            start: { x: 2, y: 0 },
                            end: { x: 8, y: 0 },
                            thickness: 1
                        }
                    ],
                    position: { x: 10, y: 7 },
                    blocking: true,
                    height: 5,
                },
            ],
            testUnit: {
                name: "Test Unit",
                baseSize: 32,
                position: { x: 15, y: 11 },  // Behind wall, on footprint
                color: "#3b82f6",
            },
            raySource: {
                type: "edge",
                points: [
                    { x: 15, y: 0 },  // Rays blocked by wall
                    { x: 12, y: 0 },
                    { x: 18, y: 0 },
                ],
            },
            expectedResult: "safe",
            notes: "Walls still block even when model is on the footprint",
        },
        {
            id: "scenario-6",
            name: "Both ON Same Terrain",
            description: "Source and target both on same footprint - clear LOS",
            boardSize: { width: 30, height: 20 },
            terrain: [
                {
                    id: "ruin-1",
                    shapes: [
                        { type: "rectangle", width: 14, height: 10 }  // Large footprint
                    ],
                    position: { x: 8, y: 5 },
                    blocking: true,
                    height: 5,
                },
            ],
            testUnit: {
                name: "Test Unit",
                baseSize: 32,
                position: { x: 15, y: 10 },  // On footprint
                color: "#3b82f6",
            },
            raySource: {
                type: "edge",
                points: [
                    { x: 12, y: 7 },   // Also on same footprint
                    { x: 18, y: 13 },  // Also on same footprint
                ],
            },
            expectedResult: "visible",
            notes: "Models on same terrain can see each other",
        },
        {
            id: "scenario-7",
            name: "Different Terrain Pieces",
            description: "Each model on different terrain - both footprints excluded",
            boardSize: { width: 30, height: 20 },
            terrain: [
                {
                    id: "ruin-a",
                    shapes: [
                        { type: "rectangle", width: 8, height: 5 }
                    ],
                    position: { x: 3, y: 1 },
                    blocking: true,
                    height: 5,
                },
                {
                    id: "ruin-b",
                    shapes: [
                        { type: "rectangle", width: 8, height: 5 }
                    ],
                    position: { x: 19, y: 14 },
                    blocking: true,
                    height: 5,
                },
            ],
            testUnit: {
                name: "Test Unit",
                baseSize: 32,
                position: { x: 23, y: 16.5 },  // Center of ruin-b
                color: "#3b82f6",
            },
            raySource: {
                type: "edge",
                points: [
                    { x: 7, y: 3.5 },  // Center of ruin-a
                ],
            },
            expectedResult: "visible",
            notes: "Each terrain's footprint excluded for its model - clear ray between them",
        },
        {
            id: "scenario-8",
            name: "Same Footprint, Wall Between",
            description: "Both on same footprint but wall separates them - should NOT see",
            boardSize: { width: 30, height: 20 },
            terrain: [
                {
                    id: "ruin-1",
                    shapes: [
                        { type: "rectangle", width: 16, height: 10 },  // Large footprint
                        {
                            type: "line",  // Wall dividing the footprint
                            start: { x: 8, y: 2 },
                            end: { x: 8, y: 8 },
                            thickness: 1
                        }
                    ],
                    position: { x: 7, y: 5 },
                    blocking: true,
                    height: 5,
                },
            ],
            testUnit: {
                name: "Test Unit",
                baseSize: 32,
                position: { x: 18, y: 10 },  // Right side of footprint
                color: "#3b82f6",
            },
            raySource: {
                type: "edge",
                points: [
                    { x: 11, y: 10 },  // Left side of footprint, behind wall
                ],
            },
            expectedResult: "safe",
            notes: "Both models on same footprint, but wall between them blocks LOS",
        },
    ];

    // ============================================================================
    // State
    // ============================================================================

    let currentScenario = $state(scenarios[0]);
    let analysisResult = $state<AnalysisResult | null>(null);

    // Konva references
    let stageContainer: HTMLDivElement;
    let stage: Konva.Stage;
    let backgroundLayer: Konva.Layer;
    let terrainLayer: Konva.Layer;
    let sourceLayer: Konva.Layer;
    let unitLayer: Konva.Layer;
    let visibilityLayer: Konva.Layer;

    // ============================================================================
    // Drawing Functions
    // ============================================================================

    function drawBackground() {
        backgroundLayer.destroyChildren();

        const width = inchesToPixels(currentScenario.boardSize.width);
        const height = inchesToPixels(currentScenario.boardSize.height);

        // Background rectangle
        const bg = new Konva.Rect({
            x: 0,
            y: 0,
            width,
            height,
            fill: "#1e293b",
            listening: false,
        });
        backgroundLayer.add(bg);

        // Grid lines - 1" intervals (light)
        for (let x = 0; x <= currentScenario.boardSize.width; x++) {
            const line = new Konva.Line({
                points: [inchesToPixels(x), 0, inchesToPixels(x), height],
                stroke: "#334155",
                strokeWidth: 1,
                listening: false,
            });
            backgroundLayer.add(line);
        }

        for (let y = 0; y <= currentScenario.boardSize.height; y++) {
            const line = new Konva.Line({
                points: [0, inchesToPixels(y), width, inchesToPixels(y)],
                stroke: "#334155",
                strokeWidth: 1,
                listening: false,
            });
            backgroundLayer.add(line);
        }

        // Grid lines - 5" intervals (bold)
        for (let x = 0; x <= currentScenario.boardSize.width; x += 5) {
            const line = new Konva.Line({
                points: [inchesToPixels(x), 0, inchesToPixels(x), height],
                stroke: "#475569",
                strokeWidth: 2,
                listening: false,
            });
            backgroundLayer.add(line);
        }

        for (let y = 0; y <= currentScenario.boardSize.height; y += 5) {
            const line = new Konva.Line({
                points: [0, inchesToPixels(y), width, inchesToPixels(y)],
                stroke: "#475569",
                strokeWidth: 2,
                listening: false,
            });
            backgroundLayer.add(line);
        }

        backgroundLayer.batchDraw();
    }

    function drawTerrain() {
        terrainLayer.destroyChildren();

        console.log(
            "Drawing terrain:",
            currentScenario.terrain.length,
            "pieces",
        );

        for (const piece of currentScenario.terrain) {
            const terrainHeight = piece.height ?? 0;

            piece.shapes.forEach((shape, index) => {
                const isFootprint = index === 0;

                if (shape.type === "rectangle") {
                    console.log(
                        `Drawing ${isFootprint ? "footprint" : "wall"}:`,
                        piece.id,
                        "at",
                        piece.position,
                        "size",
                        shape.width,
                        "x",
                        shape.height,
                    );

                    const rect = new Konva.Rect({
                        x: inchesToPixels(piece.position.x),
                        y: inchesToPixels(piece.position.y),
                        width: inchesToPixels(shape.width),
                        height: inchesToPixels(shape.height),
                        fill: isFootprint
                            ? (terrainHeight > 4 ? "#6b7280" : "#9ca3af")
                            : "#4b5563",  // Darker for walls
                        stroke: isFootprint ? "#f59e0b" : "#ef4444",  // Orange for footprint, red for walls
                        strokeWidth: 3,
                        listening: false,
                    });
                    terrainLayer.add(rect);

                    console.log(
                        "Added rect to layer:",
                        rect.x(),
                        rect.y(),
                        rect.width(),
                        rect.height(),
                    );

                    // Label (only for footprint)
                    if (isFootprint) {
                        const label = new Konva.Text({
                            x: inchesToPixels(piece.position.x),
                            y:
                                inchesToPixels(piece.position.y) +
                                inchesToPixels(shape.height) / 2 -
                                10,
                            width: inchesToPixels(shape.width),
                            text: `${shape.width}"×${shape.height}"\nH:${terrainHeight}"`,
                            fontSize: 12,
                            fill: "#ffffff",
                            align: "center",
                            listening: false,
                        });
                        terrainLayer.add(label);
                    }
                } else if (shape.type === "line") {
                    console.log(
                        "Drawing wall line:",
                        piece.id,
                        "from",
                        shape.start,
                        "to",
                        shape.end,
                    );

                    const line = new Konva.Line({
                        points: [
                            inchesToPixels(piece.position.x + shape.start.x),
                            inchesToPixels(piece.position.y + shape.start.y),
                            inchesToPixels(piece.position.x + shape.end.x),
                            inchesToPixels(piece.position.y + shape.end.y),
                        ],
                        stroke: "#ef4444",  // Red for walls
                        strokeWidth: inchesToPixels(shape.thickness),
                        listening: false,
                    });
                    terrainLayer.add(line);
                }
            });
        }

        console.log(
            "Terrain layer children count:",
            terrainLayer.getChildren().length,
        );
        terrainLayer.batchDraw();
    }

    function drawRaySources() {
        sourceLayer.destroyChildren();

        for (const point of currentScenario.raySource.points) {
            const circle = new Konva.Circle({
                x: inchesToPixels(point.x),
                y: inchesToPixels(point.y),
                radius: 6,
                fill: "#fbbf24",
                stroke: "#f59e0b",
                strokeWidth: 2,
                listening: false,
            });
            sourceLayer.add(circle);
        }

        sourceLayer.batchDraw();
    }

    function drawTestUnit() {
        unitLayer.destroyChildren();

        const unit = currentScenario.testUnit;
        const radiusInches = unit.baseSize / 25.4 / 2;

        const circle = new Konva.Circle({
            x: inchesToPixels(unit.position.x),
            y: inchesToPixels(unit.position.y),
            radius: inchesToPixels(radiusInches),
            fill: unit.color,
            stroke: "#1e40af",
            strokeWidth: 2,
            listening: false,
        });
        unitLayer.add(circle);

        // Label
        const label = new Konva.Text({
            x: inchesToPixels(unit.position.x) - 30,
            y: inchesToPixels(unit.position.y) - 20,
            text: `${unit.name}\n${unit.baseSize}mm`,
            fontSize: 10,
            fill: "#ffffff",
            listening: false,
        });
        unitLayer.add(label);

        unitLayer.batchDraw();
    }

    function drawVisibilityResult(result: AnalysisResult) {
        visibilityLayer.destroyChildren();

        const unit = currentScenario.testUnit;
        const radiusInches = unit.baseSize / 25.4 / 2;

        // Draw rays first (so they appear behind the unit overlay)
        for (const ray of result.rayResults) {
            const rayColor = ray.blocked ? "#475569" : "#ef4444"; // Gray for blocked, red for clear
            const rayOpacity = ray.blocked ? 0.3 : 0.7;
            const rayWidth = ray.blocked ? 1 : 3;

            const line = new Konva.Line({
                points: [
                    inchesToPixels(ray.source.x),
                    inchesToPixels(ray.source.y),
                    inchesToPixels(ray.target.x),
                    inchesToPixels(ray.target.y),
                ],
                stroke: rayColor,
                strokeWidth: rayWidth,
                opacity: rayOpacity,
                listening: false,
            });
            visibilityLayer.add(line);
        }

        // Draw red overlay on unit if visible (unsafe)
        if (result.result === "visible") {
            const dangerCircle = new Konva.Circle({
                x: inchesToPixels(unit.position.x),
                y: inchesToPixels(unit.position.y),
                radius: inchesToPixels(radiusInches),
                fill: "#ef4444",
                opacity: 0.4,
                listening: false,
            });
            visibilityLayer.add(dangerCircle);
        }

        // Overlay circle on unit
        const color = result.result === "safe" ? "#22c55e" : "#ef4444";
        const circle = new Konva.Circle({
            x: inchesToPixels(unit.position.x),
            y: inchesToPixels(unit.position.y),
            radius: inchesToPixels(radiusInches) + 5,
            stroke: color,
            strokeWidth: 4,
            listening: false,
        });
        visibilityLayer.add(circle);

        // Result label
        const resultText = new Konva.Text({
            x: inchesToPixels(unit.position.x) - 40,
            y:
                inchesToPixels(unit.position.y) +
                inchesToPixels(radiusInches) +
                10,
            text: result.result.toUpperCase(),
            fontSize: 14,
            fontStyle: "bold",
            fill: color,
            listening: false,
        });
        visibilityLayer.add(resultText);

        visibilityLayer.batchDraw();
    }

    function clearVisibility() {
        visibilityLayer.destroyChildren();
        visibilityLayer.batchDraw();
    }

    // ============================================================================
    // Analysis Logic
    // ============================================================================

    function analyzeVisibility(): AnalysisResult {
        console.log("=== Starting Terrain-Aware Analysis ===");
        console.log("Terrain pieces:", currentScenario.terrain.length);

        // Create enhanced collision systems
        const collisionSystems = createTerrainCollisionSystems(currentScenario.terrain);
        console.log("Collision systems created");
        console.log("  Footprint bodies:", collisionSystems.footprints.all().length);
        console.log("  Wall bodies:", collisionSystems.walls.all().length);

        // Get terrain occupancy for test unit
        const targetOccupancy = getTerrainOccupancy(
            currentScenario.testUnit.position,
            currentScenario.terrain
        );
        console.log("Target occupancy:", targetOccupancy);

        let blockedCount = 0;
        let clearCount = 0;
        const rayResults: Array<{
            source: Point;
            target: Point;
            blocked: boolean;
        }> = [];

        for (const source of currentScenario.raySource.points) {
            // Get source occupancy
            const sourceOccupancy = getTerrainOccupancy(source, currentScenario.terrain);
            console.log(`Source (${source.x}, ${source.y}) occupancy:`, sourceOccupancy);

            // Combine exclusions
            const excludeFootprints = [...sourceOccupancy, ...targetOccupancy];
            console.log("  Excluding footprints:", excludeFootprints);

            // Use terrain-aware ray blocking
            const blocked = isRayBlockedSelective(
                source,
                currentScenario.testUnit.position,
                collisionSystems,
                excludeFootprints,
                0.2
            );

            console.log(`  Ray result: ${blocked ? "BLOCKED" : "CLEAR"}`);

            rayResults.push({
                source,
                target: currentScenario.testUnit.position,
                blocked,
            });

            if (blocked) {
                blockedCount++;
            } else {
                clearCount++;
            }
        }

        console.log("=== Analysis Complete ===");
        const result = clearCount === 0 ? "safe" : "visible";
        console.log("Result:", result);
        console.log("Blocked:", blockedCount, "Clear:", clearCount);

        return {
            result,
            totalRays: currentScenario.raySource.points.length,
            blockedCount,
            clearCount,
            matchesExpected: result === currentScenario.expectedResult,
            rayResults,
        };
    }

    // ============================================================================
    // Event Handlers
    // ============================================================================

    function handleScenarioChange(scenario: TestScenario) {
        currentScenario = scenario;
        analysisResult = null;
        clearVisibility();
        drawBackground();
        drawTerrain();
        drawRaySources();
        drawTestUnit();
    }

    function handleAnalyze() {
        const result = analyzeVisibility();
        analysisResult = result;
        drawVisibilityResult(result);
    }

    function handleClear() {
        analysisResult = null;
        clearVisibility();
    }

    // ============================================================================
    // Lifecycle
    // ============================================================================

    onMount(() => {
        // Create Konva stage
        stage = new Konva.Stage({
            container: stageContainer,
            width: inchesToPixels(currentScenario.boardSize.width),
            height: inchesToPixels(currentScenario.boardSize.height),
        });

        // Create layers
        backgroundLayer = new Konva.Layer();
        terrainLayer = new Konva.Layer();
        sourceLayer = new Konva.Layer();
        unitLayer = new Konva.Layer();
        visibilityLayer = new Konva.Layer();

        stage.add(backgroundLayer);
        stage.add(terrainLayer);
        stage.add(sourceLayer);
        stage.add(unitLayer);
        stage.add(visibilityLayer);

        // Initial draw
        drawBackground();
        drawTerrain();
        drawRaySources();
        drawTestUnit();

        return () => {
            stage.destroy();
        };
    });
</script>

<div class="min-h-screen bg-slate-900 text-slate-100 p-8">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold mb-2">Ray Casting Test Sandbox</h1>
            <p class="text-slate-400">
                Isolated testing environment for line-of-sight calculations
            </p>
        </div>

        <!-- Scenario Selector -->
        <div class="mb-6 flex gap-4">
            {#each scenarios as scenario}
                <button
                    onclick={() => handleScenarioChange(scenario)}
                    class="px-4 py-2 rounded-lg font-medium transition-colors {currentScenario.id ===
                    scenario.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
                >
                    {scenario.name}
                </button>
            {/each}
        </div>

        <!-- Current Scenario Info -->
        <div class="mb-6 bg-slate-800 rounded-lg p-4">
            <div class="flex items-start justify-between">
                <div>
                    <h2 class="text-xl font-semibold mb-1">
                        {currentScenario.name}
                    </h2>
                    <p class="text-slate-400 mb-2">
                        {currentScenario.description}
                    </p>
                    <p class="text-sm text-slate-500">
                        {currentScenario.notes}
                    </p>
                </div>
                <div class="text-right">
                    <div class="text-sm text-slate-400">Expected Result:</div>
                    <div
                        class="text-lg font-bold {currentScenario.expectedResult ===
                        'safe'
                            ? 'text-green-400'
                            : 'text-red-400'}"
                    >
                        {currentScenario.expectedResult.toUpperCase()}
                    </div>
                </div>
            </div>
        </div>

        <!-- Controls -->
        <div class="mb-6 flex gap-4">
            <button
                onclick={handleAnalyze}
                class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
                Analyze
            </button>
            <button
                onclick={handleClear}
                class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
            >
                Clear
            </button>
        </div>

        <!-- Canvas Container -->
        <div class="mb-6 bg-slate-800 rounded-lg p-4">
            <div
                bind:this={stageContainer}
                class="border border-slate-700 rounded"
            ></div>
        </div>

        <!-- Results Panel -->
        {#if analysisResult}
            <div
                class="bg-slate-800 rounded-lg p-6 border-2 {analysisResult.matchesExpected
                    ? 'border-green-600'
                    : 'border-red-600'}"
            >
                <h3 class="text-xl font-semibold mb-4">Analysis Results</h3>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <!-- Status -->
                    <div>
                        <div class="text-sm text-slate-400 mb-1">Status</div>
                        <div
                            class="text-2xl font-bold {analysisResult.result ===
                            'safe'
                                ? 'text-green-400'
                                : 'text-red-400'}"
                        >
                            {analysisResult.result.toUpperCase()}
                            {analysisResult.matchesExpected ? "✓" : "✗"}
                        </div>
                    </div>

                    <!-- Total Rays -->
                    <div>
                        <div class="text-sm text-slate-400 mb-1">
                            Rays Tested
                        </div>
                        <div class="text-2xl font-bold text-slate-100">
                            {analysisResult.totalRays}
                        </div>
                    </div>

                    <!-- Blocked -->
                    <div>
                        <div class="text-sm text-slate-400 mb-1">Blocked</div>
                        <div class="text-2xl font-bold text-slate-100">
                            {analysisResult.blockedCount}
                        </div>
                    </div>

                    <!-- Clear -->
                    <div>
                        <div class="text-sm text-slate-400 mb-1">Clear</div>
                        <div class="text-2xl font-bold text-slate-100">
                            {analysisResult.clearCount}
                        </div>
                    </div>
                </div>

                <!-- Match Status -->
                <div class="mt-6 pt-6 border-t border-slate-700">
                    <div class="flex items-center gap-3">
                        <div class="text-lg font-medium">Match Expected:</div>
                        <div
                            class="text-2xl font-bold {analysisResult.matchesExpected
                                ? 'text-green-400'
                                : 'text-red-400'}"
                        >
                            {analysisResult.matchesExpected ? "YES ✓" : "NO ✗"}
                        </div>
                    </div>
                    {#if !analysisResult.matchesExpected}
                        <div class="mt-2 text-red-400">
                            ⚠️ Result does not match expected outcome. Check ray
                            casting implementation.
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="bg-slate-800 rounded-lg p-6 text-center text-slate-400">
                Click "Analyze" to run ray casting test
            </div>
        {/if}

        <!-- Legend -->
        <div class="mt-8 bg-slate-800 rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-3">Legend</h3>
            <div
                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm"
            >
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span>Ray Source Points</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full bg-blue-600"></div>
                    <span>Test Unit</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-gray-500"></div>
                    <span>Blocking Terrain</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-1 bg-red-500"></div>
                    <span>Clear Ray (Dangerous)</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-1 bg-slate-500 opacity-50"></div>
                    <span>Blocked Ray</span>
                </div>
                <div class="flex items-center gap-2">
                    <div
                        class="w-4 h-4 rounded-full bg-red-500 opacity-40"
                    ></div>
                    <span>Unsafe Area</span>
                </div>
                <div class="flex items-center gap-2">
                    <div
                        class="w-4 h-4 rounded border-2 border-green-400"
                    ></div>
                    <span>Safe (Hidden)</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded border-2 border-red-400"></div>
                    <span>Visible (Exposed)</span>
                </div>
            </div>
        </div>
    </div>
</div>
