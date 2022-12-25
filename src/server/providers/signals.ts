import { LocalSignal, LocalFunction } from 'shared/local_network';

const Signals = {
	PlayerAdded: new LocalSignal<[id: number, data: PlayerMonitor]>(),
	PlayerRemoved: new LocalSignal<[id: number, data: PlayerMonitor]>(),

	// new
	get_id_from_player: new LocalFunction<[user: Player], number>(),
	GetDataFromPlayerId: new LocalFunction<[id: number], PlayerMonitor | undefined>(),
};

export = Signals;
