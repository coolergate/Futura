import { LocalSignal, LocalFunction } from 'shared/local_network';

const Signals = {
	PlayerAdded: new LocalSignal<[id: number, data: PlayerData]>(),
	PlayerRemoved: new LocalSignal<[id: number, data: PlayerData]>(),
	GetPlayerDataFromUserId: new LocalFunction<[UserId: number], PlayerData | undefined>(),
};

export = Signals;
