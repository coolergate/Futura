import Signal from '@rbxts/signal';
import { LocalSignal, LocalFunction } from 'shared/local_network';
import * as Util from 'shared/util';

const Signals = {
	PlayerAdded: new LocalSignal<[id: number, data: PlayerMonitor]>(),
	PlayerRemoved: new LocalSignal<[id: number, data: PlayerMonitor]>(),

	get_id_from_player: new LocalFunction<[user: Player], number>(),
	GetDataFromPlayerId: new LocalFunction<[id: number], PlayerMonitor | undefined>(),

	CreateWeapon: new LocalFunction<
		[weapon_interface: BaseWeaponInfo, owner: string | undefined | 'world'],
		BaseWeaponInfo | void
	>(),

	ConsoleDebug: new LocalSignal<[...content: string[]]>(),

	Entities: {
		GetCharacterFromId: new LocalFunction<[characterid: string], BaseCharacterController | undefined>(),
		GetCharacterFromUserId: new LocalFunction<[UserId: number], BaseCharacterController | undefined>(),
		GetCharacterFromCollision: new LocalFunction<[Part: BasePart], BaseCharacterController | undefined>(),

		CreateWeaponController: new LocalFunction<[Info: BaseWeaponInfo], BaseWeaponInfo>(),
		GetCharacterCollisionBoxClone: new LocalFunction<[], Util.CacheInstance<CharacterCollision>>(),
	},
};

export = Signals;
