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
const Server_GetDataFromPlayer = Signals.GetPlayerDataFromUserId;

//=============================================================================
// ConVars & Statements
//=============================================================================
const sv_playerjoin_log = new ConVar('sv_playerjoin_log', true, '', ['ServerOnly']);
const playerlist = new Map<number, PlayerData>();
const DataStore = DataStoreService.GetDataStore('PlayerData');

declare global {
	interface PlayerData {
		Username: string;
		UserId: number;
		Score: number;
		Elo: number;
	}
}

//=============================================================================
// Functions
//=============================================================================

Server_GetDataFromPlayer.Handle = userid => {
	if (!playerlist.has(userid)) print(userid, 'doesnt exist');
	return playerlist.get(userid);
};

Client_PlayerLogin.OnServerInvoke = player => {
	print('login attempt.', player);
	if (playerlist.has(player.UserId)) return;
	let PlayerData: PlayerData = {
		Username: player.DisplayName,
		UserId: player.UserId,
		Score: 0,
		Elo: 0,
	};
	const fetch_data = DataStore.GetAsync(`player_${player.UserId}`)[0] as PlayerData;
	if (fetch_data !== undefined)
		PlayerData = {
			Username: player.DisplayName,
			UserId: player.UserId,
			Score: 0,
			Elo: 0,
		};

	playerlist.set(player.UserId, PlayerData);
	Server_PlayerAdded.Fire(player.UserId, PlayerData);
	if (sv_playerjoin_log.value === true) Client_PlayerJoined.PostAllClients([], player.DisplayName);
};

Players.PlayerRemoving.Connect(player => {
	if (sv_playerjoin_log.value === true) Client_PlayerLeft.PostAllClients([], player.DisplayName);
	Server_PlayerRemoved.Fire(player.UserId, playerlist.get(player.UserId)!);
});

Server_PlayerRemoved.Connect((id, data) => {
	DataStore.SetAsync(`player_${id}`, data);
});

//=============================================================================
// Player accessible CVars
//=============================================================================
new ConVar(
	'setname',
	function (userid: number, args: string[]) {
		const userdata = playerlist.get(userid)!;
		userdata.Username = args[0].gsub('^0', '')[0];

		playerlist.set(userid, userdata);
		return `${tostring(userid)} changed name to ${args[0]}`;
	},
	'',
	['ClientAccess'],
);
new ConVar(
	'getlocaldata',
	function (userid: number, args: string[]) {
		const userdata = playerlist.get(userid)!;
		return `${userid} userdata: {<br />Username: ${userdata.Username}<br />Score: ${userdata.Score}<br />Elo: ${userdata.Elo}<br />}`;
	},
	'',
	['ClientAccess'],
);
