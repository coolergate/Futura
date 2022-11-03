import { Remotes } from 'shared/global_resources';
import Signals from './providers/signals';

const Players = game.GetService('Players');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const DataStoreService = game.GetService('DataStoreService');

const ConsoleLevelDataStore = DataStoreService.GetDataStore('UserConsoleLevel');

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
		Kills: number;
		Deaths: number;
		Settings: Map<string, unknown>;
		UserId: number;
		Username: string;
		ConsoleLevel: number;
	}
}

// * Console level info * \\
// -3 -> failed to fetch  \\
// -2 -> banned			  \\
// -1 -> restricted 	  \\
//  0 -> player 		  \\
//  1 -> contentcreator   \\
//  2 -> admin 			  \\
//  3 -> owner 			  \\

const PlayerList = new Map<number, PlayerData>();
const admin_list = new Map<number, number>([
	[3676469645, 3], // coolergate
	[83009214, 3], // guilemos2006
]);

function GetUserConsoleLevel(userid: number): number {
	const [success, userlvl] = pcall(() => {
		const [level] = ConsoleLevelDataStore.GetAsync(`player_${tostring(userid)}`);
		return level as number | undefined;
	});

	if (admin_list.has(userid)) {
		return admin_list.get(userid)!;
	}

	if (!success) return -3;
	if (userlvl === undefined) {
		pcall(() => {
			ConsoleLevelDataStore.SetAsync(`player_${tostring(userid)}`, 0);
		});
	}

	return 0;
}

Client_PlayerLogin.SetCallback((player) => {
	if (PlayerList.get(player.UserId)) {
		return 0;
	}
	const console_userlvl = GetUserConsoleLevel(player.UserId);
	if (console_userlvl === -3) {
		player.Kick('\nFailed to fetch EnvUsrConsoleLvl\n');
		return;
	} else if (console_userlvl === -2) {
		player.Kick('\nLogin rejected.\n');
		return;
	}

	const data: PlayerData = {
		Kills: 0,
		Deaths: 0,
		Settings: new Map(),
		UserId: player.UserId,
		Username: player.DisplayName,
		ConsoleLevel: console_userlvl,
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
