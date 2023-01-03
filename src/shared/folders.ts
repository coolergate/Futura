// Creator: coolergate#2031
// Purpose: Game folders without manually searching the workspace

const ServerScriptService = game.GetService('ServerScriptService');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const RunService = game.GetService('RunService');
const Workspace = game.GetService('Workspace');
const Players = game.GetService('Players');

export function GetFolder(Name: string, Parent: Instance): Folder {
	const Folder = RunService.IsClient()
		? (Parent.WaitForChild(Name) as Folder)
		: (Parent.FindFirstChild(Name) as Folder | undefined) || new Instance('Folder', Parent);
	Folder.Name = Name;
	return Folder;
}

// base
export const Entities = GetFolder('Entities', Workspace);
export const Objects = GetFolder('Objects', Workspace);
export const Network = GetFolder('Network', ReplicatedStorage);
export const Map = GetFolder('Map', Workspace) as Folder & {
	func_entity: Folder;
	func_filter: Folder;
	ent_light: Folder;
	obj_part: Folder;
	env_prop: Folder;
	func_spawn: Folder;
};

// storage
export const Animations = GetFolder('Animations', ReplicatedStorage);
export const Interface = GetFolder('Interface', ReplicatedStorage);
export const Models = GetFolder('Models', ReplicatedStorage);
export const Sound = GetFolder('Sound', ReplicatedStorage);

export const MainScriptFolder = RunService.IsClient()
	? (Players.LocalPlayer!.WaitForChild('PlayerScripts').FindFirstChild('TS') as Folder)
	: (ServerScriptService.FindFirstChild('TS') as Folder);

// custom
export const CharacterEntity = {
	Info: GetFolder('CharacterInfo', Entities),
	Collision: GetFolder('CharacterCollision', Entities),
	Skins: GetFolder('CharacterSkins', Models),
};
export const CharacterModels = GetFolder('CharacterModels', Entities);
