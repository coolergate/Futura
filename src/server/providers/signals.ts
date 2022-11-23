import Signal from '@rbxts/signal';
import { ConVar } from 'shared/components/vars';

const Signals = {
	Load: new Signal(),
	Start: new Signal(),

	PlayerAdded: new Signal<(id: number, data: PlayerData) => void>(),
	PlayerRemoved: new Signal<(id: number, data: PlayerData) => void>(),
	GetPlayerDataFromUserId: new Instance('BindableFunction'),

	GetEntityFromUserId: new Instance('BindableFunction'),
	PlayerEntityCreated: new Signal<(Entity: PlayerEntityInfo) => void>(),
	PlayerEntitySpawned: new Signal<(Entity: PlayerEntityInfo) => void>(),
	PlayerEntityDied: new Signal<(Entity: PlayerEntityInfo) => void>(),

	BindConsoleCVar: new Signal<(ConVar: ConVar<unknown>) => void>(),
};

export = Signals;
