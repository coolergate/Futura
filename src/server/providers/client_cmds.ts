// Author: coolergate#2031
// Purpose: Create commands that can be accessed via the client's console

import Network = require('shared/network');

export const created_commands = new Array<client_command<any, any>>();

export class client_command<args extends string[], reply> {
	name: string;
	callback: (player: PlayerMonitor, ...args: args) => reply | void;

	constructor(name: string) {
		this.name = name;

		this.callback = (player, ...args) => {
			print(player);
			warn(...args);
			print('callback has not been assigned for:', this.name);
		};

		created_commands.insert(0, this);
	}
}
