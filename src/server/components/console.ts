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

import { ConVar } from 'shared/components/vars';
import Signals from '../providers/signals';
const Server_BindCommand = Signals.BindConsoleCVar;
const Server_GetDataFromPlayer = Signals.GetPlayerDataFromUserId;

import Network from 'shared/network';
const Net_RecieveCommand = Network.Console_SendArg;
const Net_ChatRecieve = Network.Chat_Revieve;
const Net_ChatSend = Network.Chat_Send;

const bound_commands = new Array<ConVar<unknown>>();

interface ServerBoundCommand {
	name: string;
	userlevel: number;
	callback: Callback;
}

Net_RecieveCommand.OnServerInvoke = (player, command, args) => {
	const userdata: PlayerData = Server_GetDataFromPlayer.Invoke(player.UserId);
	if (!userdata || !args) return 'Error code. 0x0';

	const equivalent_convar = bound_commands.find((value, index, obj) => {
		return value.name === command;
	});
	if (equivalent_convar && equivalent_convar.value_type === 'function') {
		const callback = equivalent_convar.value as Callback;
		return callback(player.UserId, args);
	}

	if (command === 'testnoreply') return '';

	return;
};

Server_BindCommand.Connect((CVar) => bound_commands.insert(0, CVar));
