// Author: coolergate#2031
// Purpose: Create and manage weapons

import GenerateString from 'shared/randomstring';
import * as Folders from 'shared/folders';
import Signals from 'server/providers/signals';
import Network from 'shared/network';

const Workspace = game.GetService('Workspace');

const WeaponRaycastParams = new RaycastParams();
WeaponRaycastParams.FilterDescendantsInstances = [
	Folders.Map.func_filter,
	Folders.Map.ent_light,
	Folders.Map.func_spawn,
	Folders.Map.env_prop,
];
WeaponRaycastParams.FilterType = Enum.RaycastFilterType.Blacklist;
WeaponRaycastParams.IgnoreWater = true;

const WeaponVisibilityParams = new RaycastParams();
WeaponVisibilityParams.FilterDescendantsInstances = [
	Folders.Map.func_filter,
	Folders.Map.ent_light,
	Folders.Map.func_spawn,
	Folders.Map.env_prop,
	Folders.CharacterEntity.Collision,
];
WeaponVisibilityParams.FilterType = Enum.RaycastFilterType.Blacklist;
WeaponVisibilityParams.IgnoreWater = true;

const BoxAreaParams = new OverlapParams();
BoxAreaParams.FilterDescendantsInstances = [
	Folders.Map.func_filter,
	Folders.Map.ent_light,
	Folders.Map.func_spawn,
	Folders.Map.env_prop,
];
BoxAreaParams.FilterType = Enum.RaycastFilterType.Blacklist;

declare global {
	interface BulletRaycastInfo {
		HitInstance: BasePart;
		HitInstancePos: Vector3;
		HitPosition: Vector3;
		HitDistance: number;
		HitMaterial: Enum.Material;
		HitNormal: Vector3;
		RayOrigin: Vector3;
	}
}

class Component implements BaseServerComponent {
	Created_Weapons = new Array<BaseWeaponInfo>();

	constructor() {
		Signals.Entities.CreateWeaponController.Handle = info => {
			const WeaponInfo = table.clone(info) as BaseWeaponInfo;
			WeaponInfo.Id = tostring(this.Created_Weapons.size() + 1);

			return WeaponInfo;
		};

		Network.Items.Weapons.Change.OnServerInvoke = (user, slot) => {
			const character = Signals.Entities.GetCharacterFromUserId.Call(user.UserId);
			const weapon = character?.Info.Inventory.Weapons.find(WeaponInfo => {
				return WeaponInfo.Slot === slot;
			});

			if (character && weapon) {
				character.Info.EquippedWeapon = weapon?.Id;
				character.NotifyController();
				character.NotifyReplicated();
				return weapon;
			}

			if (character && !weapon) {
				character.Info.EquippedWeapon = undefined;
			}

			return undefined;
		};

		Network.Items.Weapons.RegisterHits.OnServerInvoke = (user, weaponid, hits) => {
			const character = Signals.Entities.GetCharacterFromUserId.Call(user.UserId);
			const character_collision = character?.Info.CollisionBox;
			const current_weapon = character?.Info.Inventory.Weapons.find(WeaponInfo => {
				return WeaponInfo.Id === character?.Info.EquippedWeapon;
			});

			if (!character || !character_collision || !current_weapon || current_weapon.Id !== weaponid) return;
			if (hits.size() > current_weapon.BulletsPerShot) return;

			hits.forEach(info => {
				const enemy_character = Signals.Entities.GetCharacterFromCollision.Call(info.HitInstance);
				const enemy_collision = enemy_character?.Info.CollisionBox;
				if (!enemy_character || !enemy_collision) return;

				const character_position_check = Workspace.Raycast(
					info.HitInstancePos,
					info.HitInstancePos.sub(enemy_collision.Position),
					WeaponVisibilityParams,
				);
				if (character_position_check) return; // if something is in the way

				const visibility_check_1 = Workspace.Raycast(
					character_collision.CameraAttachment.WorldPosition,
					character_collision.CameraAttachment.WorldPosition.sub(enemy_collision.CameraAttachment.Position),
					WeaponVisibilityParams,
				);
				const visibility_check_2 = Workspace.Raycast(
					character_collision.CameraAttachment.WorldPosition,
					character_collision.CameraAttachment.WorldPosition.sub(enemy_collision.MainAttachment.Position),
					WeaponVisibilityParams,
				);
				const visibility_check_3 = Workspace.Raycast(
					character_collision.CameraAttachment.WorldPosition,
					character_collision.CameraAttachment.WorldPosition.sub(enemy_collision.FootAttachment.Position),
					WeaponVisibilityParams,
				);

				if (!visibility_check_1 && !visibility_check_2 && !visibility_check_3) return;

				enemy_character.Damage(current_weapon.Damage);
			});
		};
	}
	Start(): void {}

	GenerateEmptyInfo(Info: BaseWeaponInfo): BaseWeaponInfo {
		const DummyInfo = table.clone(Info);
		DummyInfo.Id = '';
		DummyInfo.Damage = 0;
		DummyInfo.MaxStoredAmmo = 0;
		DummyInfo.StoredAmmo = 0;
		DummyInfo.UsingMagazine = '';
		return DummyInfo;
	}
}

export function Init() {
	return new Component();
}
