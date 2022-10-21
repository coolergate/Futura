const Workspace = game.GetService('Workspace');
const ReplicatedStorage = game.GetService('ReplicatedStorage');

declare global {
	interface WorkspaceMapInterface extends Folder {
		func_entities: Folder;
		func_ignore: Folder;
		func_spawn: Folder;
		env_light: Folder;
		env_solid: Folder;
		env_physicsprop: Folder;
	}
	interface WorkspaceEntitiesInterface extends Folder {
		char_players: Folder;
		char_store: Folder;
		obj_projectiles: Folder;
	}
}

const Folders = {
	GModels: ReplicatedStorage.WaitForChild('GModels'),
	CModels: ReplicatedStorage.WaitForChild('CModels'),
	GMap: Workspace.WaitForChild('GMap') as WorkspaceMapInterface,
	GEntities: Workspace.WaitForChild('GEntities') as WorkspaceEntitiesInterface,
	GAnimations: ReplicatedStorage.WaitForChild('GAnimations') as Folder,

	CHudContent: ReplicatedStorage.WaitForChild('CHudContent'),
};

export = Folders;
