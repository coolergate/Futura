// Creator: coolergate#2031
// Purpose: Game folders without searching the workspace

/* eslint-disable prettier/prettier */

import * as Services from '@rbxts/services';

export const Storage = Services.ReplicatedStorage.WaitForChild('Storage') as unknown as {
	Animations: Folder;
	Models: Folder;
	Sound: Folder;
	Interface: Folder;
};
export const Workspace = Services.Workspace as unknown as {
	Entities: Folder;
	Server: Folder;
	Objects: Folder;
	Map: Folder & {
		func_entity: Folder;
		func_filter: Folder;
		ent_light: Folder;
		obj_part: Folder;
		env_prop: Folder;
		func_spawn: Folder;
	};
	Defined: Folder & {
		Network: Folder;
	};
};
export const ClientHolder = Services.RunService.IsClient() && Services.Players.LocalPlayer?.WaitForChild('PlayerScripts').FindFirstChild('TS') as Folder;
export const ServerHolder = Services.RunService.IsServer() && Services.ServerScriptService?.FindFirstChild('TS') as Folder;
