import Signal from '@rbxts/signal';
import { LocalSignal, LocalFunction } from 'shared/local_network';

const Signals = {
	Start: new Signal(),

	// ! Legacy
	CharacterRequestRespawn: new Instance('BindableFunction'),
	CharacterTookDamage: new Signal(),
	CharacterHealed: new Signal(),
	CharacterDied: new Signal(),

	CameraShoveRecoil: new Instance('BindableFunction'),

	console_sendarg: new Signal<(cmd: string) => void>(),
	console_render: new Signal<(LogType: ConsoleMessageType, Message: string) => void>(),

	Character_SendRespawnRequest: new LocalFunction<[], boolean>(),

	// new
	Open_MainMenu: new LocalSignal(),

	Character: {
		Spawned: new LocalSignal<[info: CharacterInfoLocal]>(),
		Died: new LocalSignal<[info: CharacterInfoLocal]>(),
		HealthChanged: new LocalSignal<[Previous: number, Health: number]>(),

		TookDamage: new LocalSignal<[Previous: number, Health: number]>(),
		Healed: new LocalSignal<[Previous: number, Health: number]>(),
	},
};

export = Signals;
