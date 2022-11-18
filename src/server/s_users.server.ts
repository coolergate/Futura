//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Descrição: Administrar jogadores quando conectarem no jogo

import { ConVar } from 'shared/components/vars';
import { Remotes } from 'shared/global_resources';
import Signals from './providers/signals';

const Players = game.GetService('Players');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const DataStoreService = game.GetService('DataStoreService');

const Client_PlayerReport = Remotes.Server.Get('PlayerReport');
const Client_PlayerJoined = Remotes.Server.Get('PlayerJoined');
const Client_PlayerLeft = Remotes.Server.Get('PlayerLeft');
const Client_PlayerLogin = Remotes.Server.Get('PlayerLogin');
const Client_PlayerChatted = Remotes.Server.Get('PlayerChatted');
const Client_PlayerSentMessage = Remotes.Server.Get('ChatSendMessage');

const Server_PlayerAdded = Signals.PlayerAdded;
const Server_PlayerRemoved = Signals.PlayerRemoved;

declare global {
	interface PlayerData {
		Level: number;
		XP: number;
		Kills: number;
		Deaths: number;
		UserId: number;
		Username: string;
		Settings: Map<string, unknown>;
	}
}

const PlayerList = new Map<number, PlayerData>();
const admin_list = new Array<number>();
const DataStores = {
	BannedUsers: DataStoreService.GetDataStore('BannedUsers'),
	UserSettings: DataStoreService.GetDataStore('UserSettings'),
	UserCharacterData: DataStoreService.GetDataStore('UserCharacterData'),
};

admin_list.insert(0, 3676469645); // coolergate
admin_list.insert(0, 83009214); // guilemos2006

Client_PlayerLogin.SetCallback((player) => {
	if (PlayerList.get(player.UserId)) {
		return 0;
	}

	const data: PlayerData = {
		Level: 0,
		XP: 0,
		Kills: 0,
		Deaths: 0,
		UserId: player.UserId,
		Username: player.DisplayName,
		Settings: new Map(),
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

Signals.GetPlayerDataFromUserId.OnInvoke = function (playerid: number) {
	return PlayerList.get(playerid);
};

Signals.BindConsoleCVar.Fire(
	new ConVar(
		'setname',
		function (userid: number, args: string[]) {
			const userdata = PlayerList.get(userid)!;
			userdata.Username = args[0];

			PlayerList.set(userid, userdata);
			return `${tostring(userid)} changed name to ${args[0]}`;
		},
		'',
	),
);
Signals.BindConsoleCVar.Fire(
	new ConVar(
		'myname',
		function (userid: number, args: string[]) {
			const userdata = PlayerList.get(userid)!;
			return `${userid} name: "${userdata.Username}"`;
		},
		'',
	),
);
