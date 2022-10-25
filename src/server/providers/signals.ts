import Signal from '@rbxts/signal';

class LocalFunction<params, response> {
	Call!: (...params: params[]) => response;
}

const Signals = {
	PlayerAdded: new Signal<(id: number, data: PlayerData) => void>(),
	PlayerRemoved: new Signal<(id: number, data: PlayerData) => void>(),
	GetPlayerDataFromUserId: new Instance('BindableFunction'),

	GetCharacterFromUserId: new Instance('BindableFunction'),
	SetupInventoryForCharacter: new Instance('BindableFunction'),
	CharacterCreated: new Signal<(Character: BaseCharacter) => void>(),

	ClearInventoryFromCharacter: new Signal<(char: BaseCharacter) => void>(),

	CommandFired: new Signal<(player: Player, userlvl: number, cmd: string, arg0: string) => void>(),
};

export = Signals;
