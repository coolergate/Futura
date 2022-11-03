import { Remotes } from 'shared/global_resources';
import Signals from './providers/signals';

const Server_CommandFired = Signals.CommandFired;
const Server_BindCommand = Signals.BindCommandToConsole;
const Server_GetDataFromPlayer = Signals.GetPlayerDataFromUserId;

const Client_ConsoleEvent = Remotes.Server.Get('ClientConsoleEvent');
const Client_SystemConsoleEvent = Remotes.Server.Get('SystemConsoleEvent');
const Client_SystemChatMessage = Remotes.Server.Get('SystemChatMessage');

const bound_commands = new Map<string, Callback>();

Client_ConsoleEvent.SetCallback((player, command, args) => {
	const userdata: PlayerData = Server_GetDataFromPlayer.Invoke(player.UserId);
	if (!userdata) return;

	if (command === 'setname' && userdata.ConsoleLevel > 0) {
		const old_username = userdata.Username;
		const new_username = args[0];
		userdata.Username = new_username;
		Client_SystemConsoleEvent.SendToAllPlayers(`${old_username} changed their name to ${new_username}`);
		Client_SystemChatMessage.SendToAllPlayers(`${old_username} changed their name to ${new_username}`);
		return 'changed display name.';
	}

	if (command === 'testnoreply') return;

	// check if a bound command exists
	if (bound_commands.has(command) && userdata.ConsoleLevel > 1) {
		return bound_commands.get(command)!(player, args);
	}

	return;
});

Server_BindCommand.Connect((name, callback) => bound_commands.set(name, callback));
