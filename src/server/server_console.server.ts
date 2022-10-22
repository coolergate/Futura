import Network from 'shared/network';
import Signals from './providers/signals';

const Client_SendCommand = Network.Server.Get('SendCommand');
const Server_CommandFired = Signals.CommandFired;

/*
	User levels
	3 = Owner
	2 = Admin
	1 = Player
	0 = Banned
*/

const admin_list = new Map<number, number>([
	[3676469645, 3], // coolergate
	[83009214, 3], // guilemos2006
]);

Client_SendCommand.Connect((sender, command, arg0, arg1, arg2) => {
	// Check if sender is allowed to execute server commands
	const user_level = admin_list.get(sender.UserId);
	if (user_level === undefined || user_level <= 1) return;

	Server_CommandFired.Fire(sender, command, arg0);
	return 'true';
});
