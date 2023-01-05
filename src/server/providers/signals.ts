import { LocalSignal, LocalFunction } from 'shared/local_network';

const Signals = {
	PlayerAdded: new LocalSignal<[id: number, data: PlayerMonitor]>(),
	PlayerRemoved: new LocalSignal<[id: number, data: PlayerMonitor]>(),

	get_id_from_player: new LocalFunction<[user: Player], number>(),
	GetDataFromPlayerId: new LocalFunction<[id: number], PlayerMonitor | undefined>(),

	GetCharacterFromUserId: new LocalFunction<[userid: number], CharacterServerInfo | undefined>(),

	CreateWeapon: new LocalFunction<
		[weapon_interface: BaseWeapon, owner: string | undefined | 'world'],
		BaseWeapon | void
	>(),
};

export = Signals;
