// Author: coolergate#2031
// Purpose: Create commands that can be accessed via the client's console

import Network = require('shared/network');

export const created_commands = new Array<client_command<any, any>>();

export class client_command<args extends string[], reply> {
	name: string;
	callback: (player: PlayerData_Advanced, ...args: args) => reply | void;

	constructor(name: string) {
		this.name = name;

		this.callback = (player, ...args) => {
			print(player);
			warn(...args);
		};

		created_commands.insert(0, this);
	}
}
