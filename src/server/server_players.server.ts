import Network from 'shared/network';
import Signals from './providers/signals';

const Players = game.GetService('Players');
const ReplicatedStorage = game.GetService('ReplicatedStorage');

const Client_PlayerReport = Network.Server.Get('PlayerReport');
const Client_PlayerJoined = Network.Server.Get('PlayerJoined');
const Client_PlayerLeft = Network.Server.Get('PlayerLeft');
const Client_PlayerLogin = Network.Server.Get('PlayerLogin');
const Client_PlayerChatted = Network.Server.Get('PlayerChatted');
const Client_PlayerSentMessage = Network.Server.Get('ChatSendMessage');

const Server_PlayerAdded = Signals.PlayerAdded;
const Server_PlayerRemoved = Signals.PlayerRemoved;

declare global {
	interface PlayerData {
		Kills: number;
		Deaths: number;
		Settings: Map<string, unknown>;
		UserId: number;
		Username: string;
	}
}

const PlayerList = new Map<number, PlayerData>();

Client_PlayerLogin.SetCallback((player) => {
	if (PlayerList.get(player.UserId)) {
		return 0;
	}
	const data: PlayerData = {
		Kills: 0,
		Deaths: 0,
		Settings: new Map(),
		UserId: player.UserId,
		Username: player.DisplayName,
	};
	PlayerList.set(player.UserId, data);
	Client_PlayerJoined.SendToAllPlayersExcept(player, data.Username);
	Server_PlayerAdded.Fire(player.UserId, data);
});

Players.PlayerRemoving.Connect((player) => {
	const data = PlayerList.get(player.UserId);
	if (!data) return;

	Server_PlayerRemoved.Fire(player.UserId, data);
	PlayerList.delete(player.UserId);
	Client_PlayerLeft.SendToAllPlayers(data.Username);
});
