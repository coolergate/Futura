import { GetWeapons } from 'shared/providers/weapons';
import Signals from './providers/signals';
import GenerateString from 'shared/modules/randomstring';

declare global {
	type ItemSlot = 'Primary' | 'Secondary' | 'Melee' | 'Generic';
	interface ItemInfo {
		DisplayName: string;
		ItemId: string | undefined;
		ItemOwner?: string;
		Slot: ItemSlot;
	}
	interface WeaponInfo extends ItemInfo {
		Damage: number;
		Bullets: number;
		Spread: number;
		Clip: number;
		MaxClip: number;
		ClipType: '9mm';
	}
	interface CharInventory {
		Weapons: Map<ItemSlot, string>;
		Backpack: Map<string, string>;
		Holding: string | undefined;
	}
}
/*
const ItemsList = new Map<string, ItemInfo | WeaponInfo>();
const Inventories = new Map<BaseCharacter, CharInventory>();

const Client_InventoryChanged = Network.Server.Get('InventoryChanged');

function SetupItem(item: ItemInfo | WeaponInfo, character: BaseCharacter) {
	const id = GenerateString(17);
	item.ItemId = id;
	item.ItemOwner = character;
	ItemsList.set(id, item);
	return id;
}

Signals.BindCommandToConsole.Fire('giveitem', (player: Player, args: string[]) => {
	const character: CharacterFromUserId = Signals.GetCharacterFromUserId.Invoke(player.UserId);
	if (!character || !character.Alive) {
		return 'No character found.';
	}

	const inventory = Inventories.get(character.Model);
	if (!inventory) {
		return 'No inventory has been set up for your character';
	}

	const weapon = GetWeapons().get(args[0]);
	if (!weapon) {
		warn('no such weapon:', weapon);
		return;
	}
	const setup_item = SetupItem(weapon, character.Model);
	inventory.Weapons.set(weapon.Slot, setup_item);
	return 'Gave weapon: ' + weapon.DisplayName;
});

Signals.CommandFired.Connect((player, userlvl, cmd, arg0) => {
	const character: CharacterFromUserId = Signals.GetCharacterFromUserId.Invoke(player.UserId);
	if (!character || !character.Alive) {
		warn('no such character for player:', player);
		return;
	}

	const inventory = Inventories.get(character.Model);
	if (!inventory) {
		warn('no such inventory for character:', character.Model);
		return;
	}

	if (cmd === 'giveitem' && userlvl > 1) {
		const weapon = GetWeapons().get(arg0);
		if (!weapon) {
			warn('no such weapon:', weapon);
			return;
		}
		const setup_item = SetupItem(weapon, character.Model);
		inventory.Weapons.set(weapon.Slot, setup_item);
		return;
	}

	if (cmd === 'equip' && userlvl !== 0) {
		const equivalent_weapon = ItemsList.get(arg0);
		if (!equivalent_weapon) {
			warn('no such weaponid:', arg0);
			return;
		}

		if (equivalent_weapon.ItemOwner !== character.Model) {
			warn('character does not own weapon:', arg0);
			return;
		}

		inventory.Holding = equivalent_weapon.ItemId;
	}
});

Signals.CharacterCreated.Connect((char) => {
	Inventories.set(char, { Weapons: new Map(), Backpack: new Map(), Holding: undefined });
});

Signals.ClearInventoryFromCharacter.Connect((char) => {
	const inv = Inventories.get(char);
	if (inv) {
		inv.Holding = undefined;
		inv.Weapons.forEach((id) => ItemsList.delete(id));
		inv.Backpack.forEach((id) => ItemsList.delete(id));
		inv.Weapons.clear();
		inv.Backpack.clear();
	}
});
*/
