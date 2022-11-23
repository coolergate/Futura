//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░

import Signals from '../providers/signals';
import { ConVar } from 'shared/components/vars';

const Players = game.GetService('Players');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const DataStoreService = game.GetService('DataStoreService');
const HttpService = game.GetService('HttpService');

//=============================================================================
// Network & Signals
//=============================================================================
import Network from 'shared/network';
const Client_PlayerReport = Network.PlayerReport;
const Client_PlayerJoined = Network.PlayerJoined;
const Client_PlayerLeft = Network.PlayerLeft;
const Client_PlayerLogin = Network.PlayerLogin;
const Server_PlayerAdded = Signals.PlayerAdded;
const Server_PlayerRemoved = Signals.PlayerRemoved;

//=============================================================================
// ConVars & Statements
//=============================================================================
export const sv_playerjoin_log = new ConVar('sv_playerjoin_log', true, '', ['ServerOnly']);
export const playerlist = new Map<number, PlayerData>();

declare global {
	interface PlayerCloudData {
		Level: number;
		XP: number;
		Kills: number;
		Deaths: number;
	}
	interface PlayerData {
		Username: string;
		UserId: number;
		Hidden: boolean;
		Settings: Map<string, unknown>;
		CloudData: PlayerCloudData;
	}
}

//=============================================================================
// Functions
//=============================================================================

Client_PlayerLogin.OnServerInvoke = (player) => {
	if (playerlist.has(player.UserId)) return;

	let CloudData: PlayerCloudData;
	{
		// eslint-disable-next-line prefer-const
		let [success, request] = pcall(() => {
			const [request, info] = DataStoreService.GetDataStore('PlayerData').GetAsync(`player_${player.UserId}`);
			return request as string;
		});
		if (!success)
			request = HttpService.JSONEncode({
				Level: 0,
				XP: 0,
				Kills: 0,
				Deaths: 0,
			});
		CloudData = HttpService.JSONDecode(request as string) as PlayerCloudData;
	}

	const PlayerData: PlayerData = {
		Username: player.DisplayName,
		UserId: player.UserId,
		Hidden: false,
		Settings: new Map(),
		CloudData: CloudData,
	};

	if (sv_playerjoin_log.value === true) Client_PlayerJoined.PostAllClients([], player.DisplayName);
	playerlist.set(player.UserId, PlayerData);
	Server_PlayerAdded.Fire(player.UserId, PlayerData);
};

Players.PlayerRemoving.Connect((player) => {
	if (sv_playerjoin_log.value === true) Client_PlayerLeft.PostAllClients([], player.DisplayName);
});

Signals.BindConsoleCVar.Fire(
	new ConVar(
		'setname',
		function (userid: number, args: string[]) {
			const userdata = playerlist.get(userid)!;
			userdata.Username = args[0];

			playerlist.set(userid, userdata);
			return `${tostring(userid)} changed name to ${args[0]}`;
		},
		'',
	),
);
Signals.BindConsoleCVar.Fire(
	new ConVar(
		'getlocaldata',
		function (userid: number, args: string[]) {
			const userdata = playerlist.get(userid)!;
			return `${userid} name: "${userdata.Username}"`;
		},
		'',
	),
);
