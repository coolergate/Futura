import Network from 'shared/network';
import Signals from './providers/signals';

const Server_CommandFired = Signals.CommandFired;
const Server_GetDataFromPlayer = Signals.GetPlayerDataFromUserId;

const Client_ConsoleEvent = Network.Server.Get('ClientConsoleEvent');
const Client_SystemConsoleEvent = Network.Server.Get('SystemConsoleEvent');
const Client_SystemChatMessage = Network.Server.Get('SystemChatMessage');

Client_ConsoleEvent.SetCallback((player, command, args) => {
	const userdata: PlayerData = Server_GetDataFromPlayer.Invoke(player.UserId);
	if (!userdata) return 'unable to retrieve data.';

	if (command === 'setname' && userdata.ConsoleLevel > 0) {
		const old_username = userdata.Username;
		const new_username = args[0];
		userdata.Username = new_username;
		Client_SystemConsoleEvent.SendToAllPlayers(`${old_username} changed their name to ${new_username}`);
		Client_SystemChatMessage.SendToAllPlayers(`${old_username} changed their name to ${new_username}`);
		return;
	}

	return 'unknown command or level is lower than required.';
});
