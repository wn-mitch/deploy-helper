// Deployment pattern type definitions
// All measurements in inches

import type { Point, TerrainShape } from './terrain';

export interface DeploymentZoneDefinition {
	player: 'attacker' | 'defender';
	name: string;
	shape: TerrainShape;
	position: Point;
	color?: string;
}

export interface DeploymentPattern {
	id: string;
	name: string;
	source: 'leviathan' | 'tempest' | 'custom';
	description?: string;
	zones: DeploymentZoneDefinition[];
}
