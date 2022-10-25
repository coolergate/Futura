import Net, { Definitions } from '@rbxts/net';
const Network = Net.CreateDefinitions({
	// Player events
	PlayerLogin: Definitions.ServerFunction(),
	PlayerJoined: Definitions.ServerToClientEvent<[Username: string]>(),
	PlayerLeft: Definitions.ServerToClientEvent<[Username: string]>(),
	PlayerReport: Definitions.ClientToServerEvent<[Reporting: string, Reason: string]>(),

	// Chat events
	ChatSendMessage: Definitions.ClientToServerEvent<[Message: string]>(),
	PlayerChatted: Definitions.ServerToClientEvent<[Username: string, Message: string]>(),
	SystemChatMessage: Definitions.ServerToClientEvent<[Message: string]>(),

	// Character events
	RequestRespawn: Definitions.ServerFunction<() => ClientCharacterInfo | false>(),
	CharacterStatusUpdated: Definitions.ServerToClientEvent<[NewInfo: ClientCharacterInfo]>(),

	// Inventory events
	ChangeWeapon: Definitions.ServerFunction<(weaponid: string) => WeaponInfo>(),
	UpdateWeaponStats: Definitions.ClientToServerEvent<[UpdatedInfo: string]>(),
	WeaponFired: Definitions.ClientToServerEvent<[weaponid: string, point: CFrame, client_hit: BaseCharacter[]]>(),

	// Server-side commands
	SendCommand: Definitions.ClientToServerEvent<[command: string, arg0: string, arg1?: string, arg2?: string]>(),

	// Console events
	ClientConsoleEvent: Definitions.ServerFunction<(command: string, args: string[]) => string | undefined>(),
	SystemConsoleEvent: Definitions.ServerToClientEvent<[message: string]>(),
});

export = Network;
