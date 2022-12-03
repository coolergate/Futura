// Author: coolergate#2031
// Purpose:

import { ConVar } from 'shared/components/vars';
import * as Services from '@rbxts/services';
import Network from 'shared/network';
import Signals from '../providers/signals';

declare global {
	// used by other scripts
	interface PlayerData {
		Username: string;
		UserId: number;
		Elo: number;
	}
}

interface PlayerCloudData {
	Username: string;
	Elo: number;
	CustomSettings: Map<string, unknown>;
}

interface PlayerData_Advanced extends PlayerData {
	CloudData: PlayerCloudData;
	ConsoleLevel: number;
}

class Component implements BaseServerComponent {
	ConVars = {
		PlayerJoinLog: new ConVar('sv_playerjoin_log', true, '', ['ServerOnly']),
	};

	Network = {
		PlayerReport: Network.PlayerReport,
		PlayerJoined: Network.PlayerJoined,
		PlayerLeft: Network.PlayerLeft,
		PlayerLogin: Network.PlayerLogin,
	};

	Server_PlayerAdded = Signals.PlayerAdded;
	Server_PlayerRemoved = Signals.PlayerRemoved;
	Server_GetDataFromPlayer = Signals.GetPlayerDataFromUserId;

	PlayerList = new Map<number, PlayerData_Advanced>();
	DataStore = Services.DataStoreService.GetDataStore('PlayerData');

	BuildNormalFromAdvanced(data: PlayerData_Advanced) {
		return {
			Username: data.Username,
			UserId: data.UserId,
			Elo: data.Elo,
		} as PlayerData;
	}

	constructor() {
		this.Network.PlayerLogin.OnServerInvoke = player => {
			if (this.PlayerList.has(player.UserId)) return;

			let datastore_data = this.DataStore.GetAsync(`player_${player.UserId}`)[0] as PlayerCloudData | undefined;
			if (datastore_data === undefined)
				datastore_data = {
					Username: player.Name,
					Elo: 1000,
					CustomSettings: new Map(),
				};

			// local data
			const advanced_data: PlayerData_Advanced = {
				Username: datastore_data.Username,
				UserId: player.UserId,
				Elo: datastore_data.Elo,
				CloudData: datastore_data,
				ConsoleLevel: 0,
			};

			this.PlayerList.set(player.UserId, advanced_data);
			this.Server_PlayerAdded.Fire(player.UserId, this.BuildNormalFromAdvanced(advanced_data));
			if (this.ConVars.PlayerJoinLog.value === true)
				this.Network.PlayerJoined.PostAllClients(undefined, advanced_data.Username);
		};

		Services.Players.PlayerRemoving.Connect(player => {
			const data = this.PlayerList.get(player.UserId);
			if (!data) return;

			this.Server_PlayerRemoved.Fire(player.UserId, this.BuildNormalFromAdvanced(data));
			if (this.ConVars.PlayerJoinLog.value === true)
				this.Network.PlayerLeft.PostAllClients([], player.DisplayName);
		});

		this.Server_PlayerRemoved.Connect((id, data) => {
			this.DataStore.SetAsync('player_' + tostring(id), data);
		});

		this.Server_GetDataFromPlayer.Handle = userid => {
			const data = this.PlayerList.get(userid);
			if (!data) return undefined;
			return this.BuildNormalFromAdvanced(data);
		};
	}
	Start(): void {
		new ConVar(
			'setname',
			(userid: number, args: string[]) => {
				const data = this.PlayerList.get(userid);
				if (!data) return '[!] null data';

				const old_username = data.Username;
				const new_username = args[0].gsub('^0', '')[0];

				data.Username = new_username;
				this.PlayerList.set(userid, data);
				return `${old_username} changed name to ${new_username}`;
			},
			'',
			['ClientAccess'],
		);

		new ConVar(
			'myinfo',
			(userid: number, args: string[]) => {
				const data = this.PlayerList.get(userid);
				if (!data) return '[!] null data';

				return `Username: ${data.Username}<br />Elo: ${data.Elo}<br />ConsoleLevel: ${data.ConsoleLevel}`;
			},
			'',
			['ClientAccess'],
		);
	}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
