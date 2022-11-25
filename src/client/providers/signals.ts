import Signal from '@rbxts/signal';
import { LocalSignal, LocalFunction } from 'shared/local_network';

const Signals = {
	Start: new Signal(),

	CharacterRequestRespawn: new Instance('BindableFunction'),
	CharacterTookDamage: new Signal(),
	CharacterHealed: new Signal(),
	CharacterDied: new Signal(),

	CameraShoveRecoil: new Instance('BindableFunction'),

	SendConsoleCommand: new Signal<(cmd: string) => void>(),
	RenderToConsole: new Signal<(LogType: ConsoleMessageType, Message: string) => void>(),

	Character_SendRespawnRequest: new LocalFunction<[], boolean>(),
};

export = Signals;
