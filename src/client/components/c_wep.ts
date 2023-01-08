// Author: coolergate#2031
// Reason: Client weapon controller

import * as Folders from 'shared/folders';
import * as Input from 'client/providers/input';
import Values from 'client/providers/values';
import Network from 'shared/network';
import Signals from 'client/providers/signals';

const Workspace = game.GetService('Workspace');

const WeaponRaycastParams = new RaycastParams();
WeaponRaycastParams.FilterDescendantsInstances = [
	Folders.Map.func_filter,
	Folders.Map.ent_light,
	Folders.Map.func_spawn,
];
WeaponRaycastParams.FilterType = Enum.RaycastFilterType.Blacklist;
WeaponRaycastParams.IgnoreWater = true;

class Component implements BaseClientComponent {
	WaitingWeaponDelay = false; // checked before changing weapons or shooting again

	constructor() {}
	Start(): void {
		//ANCHOR - Equipping weapons
		Input.KeycodeEvents.slot1.Activated.Connect(() => {
			this.ChangeWeapon('Primary');
		});
		Input.KeycodeEvents.slot2.Activated.Connect(() => {
			this.ChangeWeapon('Secondary');
		});
		Input.KeycodeEvents.slot3.Activated.Connect(() => {
			this.ChangeWeapon('Melee');
		});

		Input.KeycodeEvents.attack1.Activated.Connect(() => {
			if (this.WaitingWeaponDelay) return;

			const character = Values.Character;
			if (!character) return;

			const weapon = character.Inventory.Weapons.find(info => {
				return info.Id === character.EquippedWeapon;
			});
			if (!weapon || weapon.StoredAmmo <= 0) return;

			print('firing weapon');

			this.WaitingWeaponDelay = true;
			weapon.StoredAmmo--;
			Network.Items.Weapons.FiredWeapon.PostServer(Values.Camera_CFrame.Rotation);

			const Hits = this.RaycastBullets(
				weapon,
				new CFrame(character.CollisionBox.CameraAttachment.WorldPosition).mul(Values.Camera_CFrame.Rotation),
			);

			if (Hits.size() > 0) Network.Items.Weapons.RegisterHits.InvokeServer(weapon.Id, Hits);

			task.wait(weapon.Delay);
			this.WaitingWeaponDelay = false;
		});

		Signals.Character.Died.Connect(() => {
			this.WaitingWeaponDelay = false;
		});
	}

	FixedUpdate(): void {}
	Update(delta_time: number): void {
		const character = Values.Character;
		if (this.WaitingWeaponDelay || !character) return;
	}

	ChangeWeapon(slot: WeaponSlot) {
		if (this.WaitingWeaponDelay || !Values.Character) return;
		print('change weapon request', slot);
		this.WaitingWeaponDelay = true;
		const requested_weapon = Values.Character.Inventory.Weapons.find(info => {
			return info.Slot === slot;
		});

		if (Values.Character.EquippedWeapon !== requested_weapon?.Id)
			Network.Items.Weapons.Change.InvokeServer(slot).await();
		this.WaitingWeaponDelay = false;
	}

	RaycastBullets(Info: BaseWeaponInfo, Point: CFrame) {
		const Hits: BulletRaycastInfo[] = [];

		for (let index = 0; index < Info.BulletsPerShot; index++) {
			const [x, y] = [
				Info.Spread > 0 ? math.random(-Info.Spread, Info.Spread) : 0,
				Info.Spread > 0 ? math.random(-Info.Spread, Info.Spread) : 0,
			];
			const spread = CFrame.Angles(math.rad(y), 0, 0).mul(CFrame.Angles(0, math.rad(x), 0));
			const FinalOrientation = Point.mul(spread);
			const raycast = Workspace.Raycast(
				Point.Position,
				FinalOrientation.Rotation.LookVector.Unit.mul(10e8),
				WeaponRaycastParams,
			);

			if (raycast) {
				Hits.insert(0, {
					HitInstance: raycast.Instance,
					HitInstancePos: raycast.Instance.Position,
					HitPosition: raycast.Position,
					HitDistance: Point.Position.sub(raycast.Position).Magnitude,
					HitMaterial: raycast.Material,
					HitNormal: raycast.Normal,
					RayOrigin: Point.Position,
				});

				//STUB - Part on bullet hit position
				const EndPart = new Instance('Part', Folders.Map.func_filter);
				EndPart.Size = Vector3.one.mul(0.125);
				EndPart.Anchored = true;
				EndPart.Transparency = 0.5;
				EndPart.CanCollide = false;
				EndPart.CanQuery = false;
				EndPart.Position = raycast.Position;

				const Trace = new Instance('Part', Folders.Map.func_filter);
				Trace.Anchored = true;
				Trace.Transparency = 0.75;
				Trace.Material = Enum.Material.Neon;
				Trace.Color = new Color3(1, 1, 0);
				Trace.CanCollide = false;
				Trace.CanQuery = false;
				Trace.Size = new Vector3(0.1, 0.1, Point.Position.sub(raycast.Position).Magnitude);
				Trace.CFrame = CFrame.lookAt(Point.Position, raycast.Position).mul(
					new CFrame(0, 0, -Point.Position.sub(raycast.Position).Magnitude / 2),
				);
			}
		}

		return Hits;
	}
}

export function Init() {
	return new Component();
}
