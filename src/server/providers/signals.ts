import { LocalSignal, LocalFunction } from 'shared/local_network';
import { ConVar } from 'shared/components/vars';

const Signals = {
	PlayerAdded: new LocalSignal<[id: number, data: PlayerData]>(),
	PlayerRemoved: new LocalSignal<[id: number, data: PlayerData]>(),
	GetPlayerDataFromUserId: new LocalFunction<[UserId: number], PlayerData | undefined>(),

	GetEntityFromUserId: new LocalFunction<
		[UserId: number, Entity: PlayerEntityInfo_1],
		PlayerEntityInfo_1 | undefined
	>(),
	PlayerEntityCreated: new LocalSignal<[Entity: PlayerEntityInfo_1]>(),
	PlayerEntitySpawned: new LocalSignal<[Entity: PlayerEntityInfo_1]>(),
	PlayerEntityDied: new LocalSignal<[Entity: PlayerEntityInfo_1]>(),
};

export = Signals;
