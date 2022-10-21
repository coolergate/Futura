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
});

export = Network;
