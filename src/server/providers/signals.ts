import { LocalSignal, LocalFunction } from 'shared/local_network';

const Signals = {
	PlayerAdded: new LocalSignal<[id: number, data: PlayerData]>(),
	PlayerRemoved: new LocalSignal<[id: number, data: PlayerData]>(),
	GetPlayerDataFromUserId: new LocalFunction<[UserId: number], PlayerData | undefined>(),

	// new
	get_id_from_player: new LocalFunction<[user: Player], number>(),
	get_plrdata_from_id: new LocalFunction<[id: number], PlayerData | undefined>(),
};

export = Signals;
