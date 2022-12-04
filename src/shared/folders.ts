// Creator: coolergate#2031
// Purpose: Game folders without searching the workspace
const Workspace = game.GetService('Workspace');
const ReplicatedStorage = game.GetService('ReplicatedStorage');

export const Folders = {
	Client: Workspace.WaitForChild('Client') as Folder & {
		Objects: Folder;
		Entities: Folder;
	},
	Server: Workspace.WaitForChild('Server') as Folder & {
		Objects: Folder;
		Entities: Folder;
	},
	Storage: ReplicatedStorage.WaitForChild('Storage') as Folder & {
		Animations: Folder;
		Models: Folder;
		Sounds: Folder;
		UserInterface: Folder;
	},
	Characters: Workspace.WaitForChild('Characters') as Folder,
	Map: Workspace.WaitForChild('Map') as Folder & {
		Filter: Folder;
		Parts: Folder;
		Lights: Folder;
		Props: Folder;
		SpawnLocation: Folder;
	},
};
