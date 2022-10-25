export function GetWeapons() {
	return new Map<string, WeaponInfo>([
		[
			'glock17',
			{
				DisplayName: 'Glock 17',
				ItemId: undefined,
				Slot: 'Secondary',

				Damage: 10,
				Bullets: 1,
				Spread: 2,
				Clip: 17,
				MaxClip: 18,
				ClipType: '9mm',
			},
		],
	]);
}
