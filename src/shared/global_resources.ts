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
	World: Workspace.WaitForChild('World') as Folder & {
		Entities: Folder;
		Filter: Folder;
		Map: Folder & {
			Parts: Folder;
			Entities: Folder & {
				Light: Folder;
			};
			Spawns: Folder;
			Props: Folder;
		};
	},
	Storage: ReplicatedStorage.WaitForChild('Storage') as Folder & {
		Animations: Folder;
		Models: Folder;
		Sounds: Folder;
		UserInterface: Folder;
	},
};

// Networking
/*
export const Remotes = Net.CreateDefinitions({
	// Player events
	PlayerLogin: Definitions.ServerFunction(),
	PlayerJoined: Definitions.ServerToClientEvent<[Username: string]>(),
	PlayerLeft: Definitions.ServerToClientEvent<[Username: string]>(),
	PlayerReport: Definitions.ClientToServerEvent<[Reporting: string, Reason: string]>(),

	// Chat events
	ChatSendMessage: Definitions.ClientToServerEvent<[Message: string]>(),
	PlayerChatted: Definitions.ServerToClientEvent<[Username: string, Message: string]>(),
	SystemChatMessage: Definitions.ServerToClientEvent<[Message: string]>(),

	// Server-side commands
	SendCommand: Definitions.ClientToServerEvent<[command: string, arg0: string, arg1?: string, arg2?: string]>(),

	// Console events
	ClientConsoleEvent: Definitions.ServerFunction<(command: string, args: string[]) => string | undefined>(),
	SystemConsoleEvent: Definitions.ServerToClientEvent<[message: string]>(),
});

export const EntityNetwork = Net.CreateDefinitions({
	PlayerEntitySpawned: Definitions.ServerToClientEvent<[ID: string, Description?: HumanoidDescription]>(),
	EntityInfoChanged: Definitions.ServerToClientEvent<[Info: PlayerEntityInfo]>(),
	RetrieveNewEntity: Definitions.ServerFunction<() => PlayerEntityInfo | void>(),
	GetPlayersEntities: Definitions.ServerFunction<() => PlayerEntityInfoQuick[]>(),
});
*/
