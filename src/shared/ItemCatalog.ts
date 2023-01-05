// Author: coolergate#2031
// Reason: Item catalog

declare global {
	interface BaseItem {
		Id: string;
		Name: string;
		DisplayName: string;
	}

	type WeaponSlot = 'Primary' | 'Secondary' | 'Melee';
	type WeaponMode = 'Semi' | 'Auto' | 'Safe';
	type WeaponType = 'Pistol';
	interface BaseWeapon extends BaseItem {
		Slot: WeaponSlot;
		Type: WeaponType;
		Mode: WeaponMode;
		AvailableMode: WeaponMode;

		Delay: number;
		Spread: number;
		Damage: number;
		BulletsPerShot: number; // bullets per ammo, example 6 bullets per shotgun shot
		StoredAmmo: number; // number of bullets already inside the weapon
		MaxStoredAmmo: number; // number of bullets already inside the weapon
		AmmoType: WeaponAmmoType;
		UsingMagazine: string;
	}

	type WeaponAmmoType = '9mm';
	interface BaseWeaponAmmo extends BaseItem {
		StoredBullets: number; // bullets inside the magazine
		AmmoType: WeaponAmmoType;
		SpecialToWeapon: ''; // if it only applies to a single weapon
	}
}

//* THIS IS ON PURPOSE, creating alist every time it's called mostly
//* prevents from exploiters from messing with the weapon list.
//! Although not 100% safe.
export function GetDefaultWeaponList(): Array<BaseWeapon> {
	const list = new Array<BaseWeapon>();

	list.insert(0, {
		Id: '',
		Name: 'glock17',
		DisplayName: 'Glock-17',

		Slot: 'Secondary',
		Type: 'Pistol',
		Mode: 'Semi',
		AvailableMode: 'Semi',

		Delay: 1 / 3,
		Spread: 1,
		Damage: 18,
		BulletsPerShot: 1,
		StoredAmmo: 0,
		MaxStoredAmmo: 1,
		AmmoType: '9mm',
		UsingMagazine: '',
	});

	return list;
}

//* THIS IS ON PURPOSE, creating alist every time it's called mostly
//* prevents from exploiters from messing with the weapon list.
//! Although not 100% safe.
export function GetDefaultAmmoList(): Array<BaseWeaponAmmo> {
	const list = new Array<BaseWeaponAmmo>();

	list.insert(0, {
		Id: '',
		Name: '9mm_magazine',
		DisplayName: '9x19mm Magazine',

		StoredBullets: 17,
		AmmoType: '9mm',
		SpecialToWeapon: '',
	});

	return list;
}
