// Author: coolergate#2031
// Purpose: Create commands that can be accessed via the client's console

import Network = require('shared/network');

export const created_commands = new Array<client_command<any>>();

export class client_command<args extends string[]> {
	name: string;
	callback: (player: PlayerData_Advanced, ...args: args) => void | string;

	constructor(name: string) {
		this.name = name;

		this.callback = (player, ...args) => {
			print(player);
			warn(...args);
			return `command callback has not been defined! (${this.name})`;
		};

		created_commands.insert(0, this);
	}
}
