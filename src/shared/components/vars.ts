import Signal from '@rbxts/signal';

export const CreatedVars = new Array<ConVar<unknown>>();

export class ConVar<T> {
	readonly name: string;
	readonly description: string;
	readonly attributes: Map<ConVarType, boolean>;
	value: T;
	value_type: keyof CheckablePrimitives;

	readonly original_value: T;

	constructor(consolecmd: string, value: T, description: string, attributes?: ConVarType[]) {
		this.name = consolecmd;
		this.value = value;
		this.value_type = type(value);
		this.description = description;
		this.original_value = value;

		this.attributes = new Map();
		attributes?.forEach((attr) => {
			this.attributes.set(attr, true);
		});

		CreatedVars.insert(0, this);
	}

	reset() {
		this.value = this.original_value;
	}
}

declare global {
	type ConVarType = 'Hidden' | 'Readonly' | 'ServerOnly';
}
