import Signal from '@rbxts/signal';

class LocalFunction<params, response> {
	Call!: (...params: params[]) => response;
}

const Signals = {
	PlayerAdded: new Signal<(id: number, data: PlayerData) => void>(),
	PlayerRemoved: new Signal<(id: number, data: PlayerData) => void>(),
};

export = Signals;
