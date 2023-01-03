// Author: coolergate#2031
// Reason: Communication between scripts using signals

import Signal from '@rbxts/signal';
import { LocalSignal, LocalFunction } from 'shared/local_network';

const Signals = {
	Start: new Signal(),

	CameraShoveRecoil: new Instance('BindableFunction'),

	Console_SendCommand: new Signal<(cmd: string) => void>(),
	Console_RenderMessage: new Signal<(LogType: ConsoleMessageType, Message: string) => void>(),

	GUI_OpenMenu: new LocalSignal(),

	Character: {
		Spawned: new LocalSignal(),
		Died: new LocalSignal(),
		HealthChanged: new LocalSignal<[Previous: number, Health: number]>(),

		TookDamage: new LocalSignal<[Previous: number, Health: number]>(),
		Healed: new LocalSignal<[Previous: number, Health: number]>(),
	},
};

export = Signals;
