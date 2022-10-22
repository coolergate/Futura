import Signal from '@rbxts/signal';

class LocalFunction<params, response> {
	Call!: (...params: params[]) => response;
}

const Signals = {
	PlayerAdded: new Signal<(id: number, data: PlayerData) => void>(),
	PlayerRemoved: new Signal<(id: number, data: PlayerData) => void>(),

	CommandFired: new Signal<(player: Player, cmd: string, arg0: string) => void>(),
};

export = Signals;
