//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Handle commands being sent from client's console and as well the chat.

import { ConVar, CreatedVars } from 'shared/components/vars';
import Signals from '../providers/signals';
const Server_GetDataFromPlayer = Signals.GetPlayerDataFromUserId;

import Network from 'shared/network';
const Net_RecieveCommand = Network.Console_SendArg;
const Net_ChatRecieve = Network.Chat_Revieve;
const Net_ChatSend = Network.Chat_Send;

interface ServerBoundCommand {
	name: string;
	userlevel: number;
	callback: Callback;
}

Net_RecieveCommand.OnServerInvoke = (player, command, args) => {
	if (command === undefined || args === undefined) return;

	const userdata = Server_GetDataFromPlayer.Call(player.UserId).await()[1] as PlayerData | undefined;
	if (!userdata) return 'Error code. 0x0';

	let equivalent_convar: ConVar<unknown> | undefined;

	CreatedVars.forEach(cvar => {
		if (equivalent_convar !== undefined) return;
		if (cvar.attributes.has('ClientAccess') && cvar.name === command) equivalent_convar = cvar;
	});
	if (equivalent_convar && type(equivalent_convar.value) === 'function') {
		const callback = equivalent_convar.value as (...args: unknown[]) => string;
		return callback(player.UserId, args);
	}

	if (command === 'testnoreply') return '';

	return '';
};

Network.Console_GetServerArgs.OnServerInvoke = () => {
	const list = new Array<string>();
	CreatedVars.forEach(convar => {
		if (convar.attributes.has('ClientAccess')) list.insert(0, convar.name);
	});
	return list;
};
