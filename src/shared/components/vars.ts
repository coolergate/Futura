import { RunService } from '@rbxts/services';
import Signal from '@rbxts/signal';

export const CreatedVars = new Array<CVar<unknown>>();
export class CVar<T> {
	readonly name: string;
	readonly description: string;
	readonly attributes: Map<CVarAttribute, boolean>;
	value: T;
	value_type: keyof CheckablePrimitives;

	readonly original_value: T;

	constructor(consolecmd: string, value: T, description: string, attributes?: CVarAttribute[]) {
		this.name = consolecmd;
		this.value = value;
		this.value_type = type(value);
		this.description = description;
		this.original_value = value;

		this.attributes = new Map();
		attributes?.forEach(attr => {
			this.attributes.set(attr, true);
		});

		CreatedVars.insert(0, this);
	}

	reset() {
		this.value = this.original_value;
	}
}

declare global {
	type CVarAttribute = 'Hidden' | 'Readonly' | 'ClientAccess';
}

export function GetCVar(name: string) {
	return CreatedVars.find(cvar => {
		return cvar.name === name;
	});
}

export const CreatedCommands = new Array<ConCommand>();
export class ConCommand {
	name: string;
	OnInvoke: (...args: string[]) => unknown;

	constructor(console_name: string) {
		this.name = console_name;

		this.OnInvoke = () => {
			warn(this.name, 'has not been set up!');
			return;
		};

		CreatedCommands.insert(0, this);
	}
}

export const CreatedServerCommands = new Array<Server_ConCommand>();
export class Server_ConCommand {
	name: string;
	OnInvoke: (player: PlayerMonitor, ...args: string[]) => string | void;

	constructor(console_name: string) {
		assert(RunService.IsServer(), 'Cannot run Server_ConCommand on client!');
		this.name = console_name;

		this.OnInvoke = () => {
			warn(this.name, 'has not been set up!');
			return;
		};

		CreatedServerCommands.insert(0, this);
	}
}
