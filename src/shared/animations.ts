interface animDescription {
	name: string;
	priority: number;
	id: string;
}
const animations = new Map<string, animDescription>([
	[
		'walk',
		{
			name: 'walk',
			priority: 1,
			id: 'rbxassetid://11320934741',
		},
	],
]);

export = animations;
