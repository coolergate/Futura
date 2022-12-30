// Creator: coolergate#2031
// Purpose: Game folders without manually searching the workspace

import * as Services from '@rbxts/services';

export function GetFolder(Name: string, Parent: Instance): Folder {
	const Folder = Services.RunService.IsClient()
		? (Parent.WaitForChild(Name) as Folder)
		: (Parent.FindFirstChild(Name) as Folder | undefined) || new Instance('Folder', Parent);
	Folder.Name = Name;
	return Folder;
}

// base
export const Entities = GetFolder('Entities', Services.Workspace);
export const Objects = GetFolder('Objects', Services.Workspace);
export const Network = GetFolder('Network', Services.ReplicatedStorage);
export const Map = GetFolder('Map', Services.Workspace) as Folder & {
	func_entity: Folder;
	func_filter: Folder;
	ent_light: Folder;
	obj_part: Folder;
	env_prop: Folder;
	func_spawn: Folder;
};

// storage
export const Animations = GetFolder('Animations', Services.ReplicatedStorage);
export const Interface = GetFolder('Interface', Services.ReplicatedStorage);
export const Models = GetFolder('Models', Services.ReplicatedStorage);
export const Sound = GetFolder('Sound', Services.ReplicatedStorage);

export const MainScriptFolder = Services.RunService.IsClient()
	? (Services.Players.LocalPlayer!.WaitForChild('PlayerScripts').FindFirstChild('TS') as Folder)
	: (Services.ServerScriptService.FindFirstChild('TS') as Folder);

// custom
export const CharacterEntity = {
	Info: GetFolder('CharacterInfo', Entities),
	Collision: GetFolder('CharacterCollision', Entities),
	Skins: GetFolder('CharacterSkins', Models),
};
export const CharacterModels = GetFolder('CharacterModels', Entities);
