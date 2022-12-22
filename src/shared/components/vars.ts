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
