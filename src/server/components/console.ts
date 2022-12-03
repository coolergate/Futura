// Author: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import Network from 'shared/network';
import Signals from 'server/providers/signals';
import { ConVar, CreatedVars } from 'shared/components/vars';

class Component implements BaseServerComponent {
	Network = {
		Console_Recieve: Network.Console_SendArg,
		Chat_Recieve: Network.Chat_Revieve,
		Chat_Send: Network.Chat_Send,
		GetServerCmds: Network.Console_GetServerArgs,
	};

	Server_GetDataFromPlayer = Signals.GetPlayerDataFromUserId;

	constructor() {
		this.Network.Console_Recieve.OnServerInvoke = (user, command, args) => {
			if (command === undefined || args === undefined) return;

			let equivalent_convar: ConVar<unknown> | undefined;
			CreatedVars.forEach(cvar => {
				if (equivalent_convar !== undefined) return;
				if (cvar.attributes.has('ClientAccess') && cvar.name === command) equivalent_convar = cvar;
			});

			if (equivalent_convar && type(equivalent_convar.value) === 'function') {
				const callback = equivalent_convar.value as (...args: unknown[]) => string;
				const data = Signals.GetPlayerDataFromUserId.Call(user.UserId).await()[1] as PlayerData | undefined;
				if (!data) return '[!] Unable to retrieve player data';
				return callback(user.UserId, args);
			}

			if (command === 'testnoreply') return '';
		};
	}
	Start(): void {}
}

export function Init() {
	return new Component();
}

export const InitOrder = 10;
