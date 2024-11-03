export type IScanData = {
	time: number;
	pos: Vector2;
	cell: Record<string, number>;
	units: { type: string; }[];
	structures: { type: string; }[];
}[];
