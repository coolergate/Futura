import Signal from '@rbxts/signal';

class LocalFunction<params, response> {
	Call!: (...params: params[]) => response;
}

const Signals = {
	PlayerAdded: new Signal<(id: number, data: PlayerData) => void>(),
	PlayerRemoved: new Signal<(id: number, data: PlayerData) => void>(),
	GetPlayerDataFromUserId: new Instance('BindableFunction'),

	GetEntityFromUserId: new Instance('BindableFunction'),
	PlayerEntityCreated: new Signal<(Entity: PlayerEntityInfo) => void>(),
	PlayerEntitySpawned: new Signal<(Entity: PlayerEntityInfo) => void>(),
	PlayerEntityDied: new Signal<(Entity: PlayerEntityInfo) => void>(),

	CommandFired: new Signal<(player: Player, userlvl: number, cmd: string, arg0: string) => void>(),
	BindCommandToConsole: new Signal<(name: string, callback: Callback) => void>(),
};

export = Signals;
