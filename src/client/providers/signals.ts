import Signal from '@rbxts/signal';

const Signals = {
	Start: new Signal(),

	CharacterRequestRespawn: new Instance('BindableFunction'),
	CharacterTookDamage: new Signal(),
	CharacterHealed: new Signal(),
	CharacterDied: new Signal(),

	CameraShoveRecoil: new Instance('BindableFunction'),

	SendConsoleCommand: new Signal<(cmd: string) => void>(),
};

export = Signals;
