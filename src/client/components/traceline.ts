const Workspace = game.GetService('Workspace');

function Traceline(Origin: Vector3, Direction: Vector3, ignoreList: Instance[] = []) {
	const TracelineParams = new RaycastParams();
	TracelineParams.CollisionGroup = 'GBaseCharacters';
	TracelineParams.FilterDescendantsInstances = ignoreList;
	TracelineParams.FilterType = Enum.RaycastFilterType.Blacklist;

	return Workspace.Raycast(Origin, Direction, TracelineParams);
}

export = Traceline;
