import Signal from '@rbxts/signal';

const Signals = {
	Load: new Signal(),
	Start: new Signal(),

	CharacterRequestRespawn: new Instance('BindableFunction'),
	CharacterTookDamage: new Signal(),
	CharacterHealed: new Signal(),
	CharacterDied: new Signal(),

	CameraShoveRecoil: new Instance('BindableFunction'),

	SendConsoleCommand: new Signal<(cmd: string) => void>(),
	RenderToConsole: new Signal<(LogType: ConsoleLogType, Message: string) => void>(),
};

export = Signals;
