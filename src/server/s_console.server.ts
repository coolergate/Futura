import { ConVar } from 'shared/components/vars';
import { Remotes } from 'shared/global_resources';
import Signals from './providers/signals';
const Server_BindCommand = Signals.BindConsoleCVar;
const Server_GetDataFromPlayer = Signals.GetPlayerDataFromUserId;

const Client_ConsoleEvent = Remotes.Server.Get('ClientConsoleEvent');
const Client_SystemConsoleEvent = Remotes.Server.Get('SystemConsoleEvent');
const Client_SystemChatMessage = Remotes.Server.Get('SystemChatMessage');

const bound_commands = new Array<ConVar<unknown>>();

interface ServerBoundCommand {
	name: string;
	userlevel: number;
	callback: Callback;
}

Client_ConsoleEvent.SetCallback((player, command, args) => {
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
});

Server_BindCommand.Connect((CVar) => bound_commands.insert(0, CVar));
