// Author: coolergate#2031
// Purpose: Create and manage entities
//==================================================================//

import GenerateString from 'shared/randomstring';
import { LocalSignal } from 'shared/local_network';
import { CVar, Server_ConCommand } from 'shared/vars';
import Signals from 'server/providers/signals';
import * as Folders from 'shared/folders';
import Network from 'shared/network';
import { GetDefaultWeaponList } from 'shared/ItemCatalog';

const PhysicsService = game.GetService('PhysicsService');
const RunService = game.GetService('RunService');
const Workspace = game.GetService('Workspace');
const Players = game.GetService('Players');

// ANCHOR Folders
const Folder_CharacterCollisions = Folders.CharacterEntity.Collision;
const Folder_HumanoidDescriptions = Folders.GetFolder('HumanoidDescriptions', Folders.Entities);

//SECTION Character entity
const List_CharacterControllers = new Array<CharacterController>();
const Command_RespawnEntity = new Server_ConCommand('char_respawn');
const HumanoidDescription_Default = new Instance('HumanoidDescription', Folder_HumanoidDescriptions);
HumanoidDescription_Default.Name = 'DefaultHumanoidDescription';

PhysicsService.RegisterCollisionGroup('CharacterEntity');
PhysicsService.RegisterCollisionGroup('CharacterModel');

PhysicsService.CollisionGroupSetCollidable('CharacterEntity', 'CharacterModel', false);
PhysicsService.CollisionGroupSetCollidable('CharacterModel', 'CharacterModel', false);
PhysicsService.CollisionGroupSetCollidable('CharacterModel', 'Default', false);

//ANCHOR CVars
const cvar_default_maxhealth = new CVar('char_starting_maxhealth', 150, '');
const cvar_default_health = new CVar('char_starting_health', cvar_default_maxhealth.value, '');

declare global {
	interface CharacterCollision extends Part {
		CameraAttachment: Attachment;
		MainAttachment: Attachment;
	}
	interface CharacterLocalInfo {
		CollisionBox: CharacterCollision;
		Alive: boolean;
		Health: number;
		MaxHealth: number;
		Inventory: Client_CharacterInventoryInfo;
	}

	interface CharacterReplicatedInfo {
		Alive: boolean;
		CollisionBox: CharacterCollision;
		Angle: Vector2;
		Position: Vector3;
		HumanoidDescription: HumanoidDescription;
	}

	interface CharacterServerInfo {
		Id: string;
		CollisionBox: CharacterCollision;
		Info: {
			Controlling: PlayerMonitor | undefined;
			Description: HumanoidDescription | undefined;

			Alive: boolean;
			Health: number;
			HealthMax: number;

			Angle: Vector2;

			Inventory: {
				Weapons: WeaponController[];
				Generic: BaseItem[];
				CurrentEquipped: string;
			};
		};
	}

	interface Client_CharacterInventoryInfo {
		Weapons: BaseWeapon[];
		Generic: BaseItem[];
		CurrentEquipped: string;
	}
}

// ANCHOR CharacterController
class CharacterController {
	readonly id = tostring(Folder_CharacterCollisions.GetChildren().size() + 1); //GenerateString(math.random(10, 20));
	collisionbox: CharacterCollision;

	private PInfo = {
		identifier: RunService.IsStudio()
			? 'character_' + tostring(Folder_CharacterCollisions.GetChildren().size() + 1)
			: GenerateString(math.random(10, 20)),
	};

	Info = {
		Controlling: undefined as PlayerMonitor | undefined,
		Description: HumanoidDescription_Default as HumanoidDescription | undefined,

		Alive: false,
		Health: 0,
		HealthMax: cvar_default_maxhealth.value,

		Angle: new Vector2(),

		Inventory: {
			Weapons: [] as WeaponController[],
			Generic: [] as BaseItem[],
			CurrentEquipped: '',
		},
	};

	// signals
	signal_damaged = new LocalSignal<[amount: number]>();
	signal_died = new LocalSignal<[Controller: PlayerMonitor | undefined]>();

	private CreateCollisionBox() {
		const cbox = new Instance('Part', Folder_CharacterCollisions) as CharacterCollision;
		cbox.Size = new Vector3(2, 5, 2);
		cbox.Transparency = 0.5;
		cbox.CastShadow = false;
		cbox.CustomPhysicalProperties = new PhysicalProperties(1, 1, 0, 0, 100);
		cbox.Anchored = true;
		cbox.CFrame = new CFrame(0, 10e8, 0);
		cbox.Name = this.PInfo.identifier;
		cbox.CollisionGroup = 'CharacterEntity';

		const gyro = new Instance('BodyGyro', cbox);
		gyro.CFrame = new CFrame();
		gyro.MaxTorque = new Vector3(10e99, 10e99, 10e99);

		// vforce attachment
		const main_attach = new Instance('Attachment', cbox);
		main_attach.Name = 'MainAttachment';

		// camera attachment
		const cam_attach = new Instance('Attachment', cbox);
		cam_attach.Position = new Vector3(0, 2, 0);
		cam_attach.Name = 'CameraAttachment';

		return cbox;
	}

	constructor() {
		this.collisionbox = this.CreateCollisionBox();

		this.collisionbox.Destroying.Connect(() => {
			this.Kill();
			this.collisionbox = this.CreateCollisionBox();
		});
	}

	Damage(amount: number) {
		if (this.Info.Controlling === undefined) return;
		this.Info.Health = math.clamp(this.Info.Health - amount, 0, this.Info.HealthMax);
		if (this.Info.Health <= 0 && this.Info.Alive) this.Kill();
		else {
			this.signal_damaged.Fire(amount);
			this.NotifyController();
		}
	}

	Kill() {
		this.Info.Alive = false;
		this.Info.Health = 0;
		this.signal_died.Fire(this.Info.Controlling);

		this.NotifyController();
		this.NotifyReplicated();

		this.Unassign();

		this.collisionbox.Anchored = true;
		this.collisionbox.CFrame = new CFrame(0, 10e8, 0);
	}

	Spawn() {
		if (this.Info.Controlling === undefined || this.collisionbox.GetNetworkOwner() === undefined) {
			Signals.ConsoleDebug.Fire('Spawn method requires one user controlling');
			print('ControllerId:', this.id);
			return;
		}

		this.collisionbox.Anchored = true;

		// Random spawn location
		const spawn_children = Folders.Map.func_spawn.GetChildren();
		let Spawn_Location = new CFrame(0, 10, 0);
		if (!spawn_children.isEmpty()) {
			let Found = false;
			do {
				const result = spawn_children[math.random(0, spawn_children.size())];
				if (!result || !result.IsA('BasePart')) continue;

				Spawn_Location = result.CFrame;
				Found = true;
				break;
			} while (Found === false);
		}

		this.collisionbox.CFrame = Spawn_Location;
		this.collisionbox.Anchored = false;
		if (this.Info.Controlling !== undefined) this.collisionbox.SetNetworkOwner(this.Info.Controlling.Instance);

		this.Info.HealthMax = cvar_default_maxhealth.value;
		this.Info.Health = math.clamp(cvar_default_health.value, 1, cvar_default_maxhealth.value);
		this.Info.Alive = true;

		this.NotifyController();
		this.NotifyReplicated();

		//STUB - Starting weapon;
		const BaseTestWeapon = new WeaponController(
			GetDefaultWeaponList().find(info => {
				return info.Name === 'glock17';
			})!,
		);
		BaseTestWeapon.Carrier = this;
		BaseTestWeapon.Active = true;
		BaseTestWeapon.Info.StoredAmmo = 99;
		this.Info.Inventory.Weapons.insert(0, BaseTestWeapon);
		this.Info.Inventory.CurrentEquipped = BaseTestWeapon.Id;
	}

	Assign(PlayerInfo: PlayerMonitor) {
		const description =
			(Folder_HumanoidDescriptions.FindFirstChild(tostring(PlayerInfo.Instance)) as
				| HumanoidDescription
				| undefined) || Players.GetHumanoidDescriptionFromUserId(PlayerInfo.UserId);
		description.Parent = Folder_HumanoidDescriptions;
		description.Name = tostring(PlayerInfo.UserId);

		this.Info.Description = description;
		this.Info.Controlling = PlayerInfo;
		this.collisionbox.Anchored = false;
		this.collisionbox.SetNetworkOwner(PlayerInfo.Instance);
	}

	Unassign() {
		this.Info.Controlling = undefined;
		this.Info.Description = HumanoidDescription_Default;
		this.collisionbox.Anchored = false;
		this.collisionbox.SetNetworkOwner();
	}

	//SECTION - Controller networking
	NotifyController() {
		if (this.Info.Controlling === undefined) return;
		Network.Entities.Character.LocalInfoChanged.PostClient(
			[this.Info.Controlling.Instance],
			this.Info.Alive ? this.GenerateLocalInfo() : undefined,
		);
	}

	NotifyReplicated() {
		Network.Entities.Character.ReplicatedInfoChanged.PostAllClients([], this.GenerateReplicatedInfo());
	}

	GenerateLocalInfo(): CharacterLocalInfo {
		const WeaponsInfo: BaseWeapon[] = [];
		this.Info.Inventory.Weapons.forEach(controller => {
			WeaponsInfo.insert(0, controller.Info);
		});

		const GenericInfo: BaseItem[] = [];
		//TODO - Generic items info list

		const Info: CharacterLocalInfo = {
			Alive: this.Info.Alive,
			Health: this.Info.Health,
			MaxHealth: this.Info.HealthMax,
			CollisionBox: this.collisionbox,
			Inventory: {
				Weapons: WeaponsInfo,
				Generic: GenericInfo,
				CurrentEquipped: this.Info.Inventory.CurrentEquipped,
			},
		};
		return Info;
	}

	GenerateReplicatedInfo(): CharacterReplicatedInfo {
		return {
			Alive: this.Info.Alive,
			CollisionBox: this.collisionbox,
			Angle: this.Info.Angle,
			Position: this.collisionbox.CFrame.Position,
			HumanoidDescription: HumanoidDescription_Default, // TODO Handle different skins
		};
	}

	GenerateServerInfo(): CharacterServerInfo {
		return {
			Id: this.PInfo.identifier,
			CollisionBox: this.collisionbox,
			Info: this.Info,
		};
	}
	//!SECTION
}

// create 5 controllers above maxplayers
for (let index = 0; index < Players.MaxPlayers + 5; index++) {
	const Controller = new CharacterController();
	List_CharacterControllers.insert(0, Controller);

	Controller.signal_died.Connect(Monitor => {
		if (Monitor === undefined) return;
		print(Monitor.Instance, 'died.');
	});
}
List_CharacterControllers.sort((a, b) => {
	return a.id < b.id;
});

//ANCHOR Character respawning
Command_RespawnEntity.OnInvoke = MonitorData => {
	// search if the player already has a controller assigned
	if (
		List_CharacterControllers.find(controller => {
			return controller.Info.Controlling === MonitorData;
		})
	)
		return 'Already has an controller assigned';

	let controller: CharacterController | undefined;
	while (controller === undefined)
		for (let index = 0; index < List_CharacterControllers.size(); index++) {
			const element = List_CharacterControllers[index];
			if (element.Info.Controlling === undefined) controller = element;
			if (controller !== undefined) break;
		}

	controller.Kill();
	controller.Unassign();
	controller.Assign(MonitorData);
	controller.collisionbox.SetNetworkOwner(MonitorData.Instance); // needs to be set manually for some reason
	controller.Spawn();
};

Network.Entities.Character.LocalInfoUpdate.OnServerPost = (user, Orientation, Position) => {
	const user_data = Signals.GetDataFromPlayerId.Call(user.UserId);
	if (!user_data || Orientation === undefined || Position === undefined) return;

	const user_controller = List_CharacterControllers.find(controller => {
		return controller.Info.Controlling?.UserId === user_data.UserId;
	});
	if (!user_controller) return;

	user_controller.Info.Angle = Orientation;
	user_controller.NotifyReplicated();
};

Network.Entities.Character.GetCurrentReplicated.OnServerInvoke = player => {
	const list: CharacterReplicatedInfo[] = [];
	List_CharacterControllers.forEach(controller => {
		list.insert(0, controller.GenerateReplicatedInfo());
	});
	return list;
};

Signals.GetCharacterFromUserId.Handle = userid => {
	const equivalent_controller = List_CharacterControllers.find(controller => {
		return controller.Info.Controlling?.UserId === userid;
	});
	return equivalent_controller !== undefined ? equivalent_controller.GenerateServerInfo() : undefined;
};
//!SECTION

//SECTION - Weapons
const WorldWeaponsList = new Map<string, BaseWeapon>();
const WorldWeaponAmmoList = new Map<string, BaseWeaponAmmo>();
const List_WeaponController = new Array<WeaponController>();

const WeaponRaycastParams = new RaycastParams();
WeaponRaycastParams.FilterDescendantsInstances = [
	Folders.Map.func_filter,
	Folders.Map.ent_light,
	Folders.Map.func_spawn,
];
WeaponRaycastParams.FilterType = Enum.RaycastFilterType.Blacklist;
WeaponRaycastParams.IgnoreWater = true;

class WeaponController {
	readonly Id: string;

	Active = false;
	CanShootAgain = true;
	Carrier = undefined as CharacterController | undefined;
	Info: BaseWeapon;

	constructor(WeaponInfo: BaseWeapon) {
		let GeneratedId = GenerateString(20);
		while (WorldWeaponsList.has(GeneratedId)) GeneratedId = GenerateString(20);

		this.Id = GeneratedId;
		this.Info = table.clone(WeaponInfo) as BaseWeapon;
		this.Info.Id = this.Id;
	}

	Activate(Orientation: CFrame) {
		if (!this.Carrier || !this.CanShootAgain) return;

		const Magazine = WorldWeaponAmmoList.get(this.Info.UsingMagazine);

		for (this.Info.StoredAmmo; this.Info.StoredAmmo > 0; this.Info.StoredAmmo--) {
			this.CanShootAgain = false;
			this.ShootBullet(Orientation);

			if (this.Info.StoredAmmo === 0) {
				if (Magazine !== undefined && this.Info.Type === 'Pistol') {
					Magazine.StoredBullets--;
					this.Info.StoredAmmo++;
				} else {
					this.CanShootAgain = true;
					return;
				}
			}

			task.wait(this.Info.Delay);
			this.CanShootAgain = true;
			if (this.Info.Mode !== 'Auto') break;
		}
	}

	private ShootBullet(Direction: CFrame) {
		const Origin = this.Carrier!.collisionbox.CameraAttachment.WorldPosition;
		for (let index = 0; index < this.Info.BulletsPerShot; index++) {
			const [x, y] = [
				this.Info.Spread > 0 ? math.random(-this.Info.Spread, this.Info.Spread) : 0,
				this.Info.Spread > 0 ? math.random(-this.Info.Spread, this.Info.Spread) : 0,
			];
			const spread = CFrame.Angles(math.rad(y), 0, 0).mul(CFrame.Angles(0, math.rad(x), 0));
			const LookVector = Direction.mul(spread).LookVector.Unit;
			const raycast = Workspace.Raycast(Origin, LookVector.mul(10e8), WeaponRaycastParams);

			if (raycast) {
				const HitInstance = raycast.Instance;
				const Position = raycast.Position;
				const Material = raycast.Material;
				const Normal = raycast.Normal;

				if (HitInstance.CollisionGroup === 'CharacterEntity') {
					const controller = List_CharacterControllers.find(controller => {
						return controller.collisionbox === HitInstance;
					});
					if (!controller) {
						Signals.ConsoleDebug.Fire('Unknown character controller', HitInstance.Name);
						return;
					}

					controller.Damage(this.Info.Damage);
				}

				//STUB - Part on bullet hit position
				const EndPart = new Instance('Part', Folders.Map.func_filter);
				EndPart.Size = Vector3.one.mul(0.125);
				EndPart.Anchored = true;
				EndPart.Transparency = 0.5;
				EndPart.CanCollide = false;
				EndPart.CanQuery = false;
				EndPart.Position = Position;

				const Trace = new Instance('Part', Folders.Map.func_filter);
				Trace.Anchored = true;
				Trace.Transparency = 0.75;
				Trace.Material = Enum.Material.Neon;
				Trace.Color = new Color3(1, 1, 0);
				Trace.CanCollide = false;
				Trace.CanQuery = false;
				Trace.Size = new Vector3(0.1, 0.1, Origin.sub(Position).Magnitude);
				Trace.CFrame = CFrame.lookAt(Origin, Position).mul(
					new CFrame(0, 0, -Origin.sub(Position).Magnitude / 2),
				);
			}
		}
	}
}

Network.Items.EquipWeapon.OnServerPost = (player, WeaponId) => {
	const CharacterController = List_CharacterControllers.find(char => {
		return char.Info.Controlling?.UserId === player.UserId;
	});
	if (!CharacterController) {
		warn('No Character controller');
		return;
	}

	const WeaponInfo = CharacterController.Info.Inventory.Weapons.find(controller => {
		return controller.Id === WeaponId;
	});
	if (WeaponInfo) {
		WeaponInfo.Active = true;
		CharacterController.Info.Inventory.CurrentEquipped = WeaponId;
	}
};

Network.Items.Fire_Weapon.OnServerPost = (player, orientation) => {
	const CharacterController = List_CharacterControllers.find(char => {
		return char.Info.Controlling?.UserId === player.UserId;
	});
	if (!CharacterController) {
		warn('No Character controller');
		return;
	}

	const EquippedWeaponId = CharacterController.Info.Inventory.CurrentEquipped;
	const WeaponController = CharacterController.Info.Inventory.Weapons.find(controller => {
		return controller.Id === EquippedWeaponId;
	});
	if (WeaponController) {
		Signals.ConsoleDebug.Fire('Activating weapon!');
		WeaponController.Activate(orientation);
	} else {
		warn('No weapon controller');
	}
};
//!SECTION

//SECTION Default component stuff
class Component implements BaseServerComponent {
	constructor() {}
	Start(): void {}
}

export function Init() {
	return new Component();
}
//!SECTION
