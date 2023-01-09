// Author: coolergate#2031
// Purpose: Create and manage entities
//==================================================================//

import GenerateString from 'shared/randomstring';
import Signals from 'server/providers/signals';
import Network from 'shared/network';
import * as Folders from 'shared/folders';
import * as Util from 'shared/util';
import { GetDefaultWeaponList } from 'shared/ItemCatalog';
import { LocalSignal } from 'shared/local_network';
import { CVar, Server_ConCommand } from 'shared/vars';

const PhysicsService = game.GetService('PhysicsService');
const RunService = game.GetService('RunService');
const Workspace = game.GetService('Workspace');
const Players = game.GetService('Players');

//ANCHOR - Folders
const Folder_CharacterCollisions = Folders.CharacterEntity.Collision;
const Folder_HumanoidDescriptions = Folders.GetFolder('HumanoidDescriptions', Folders.Entities);

//SECTION - Character entity
const List_CharacterControllers = new Array<CharacterController>();
const Command_RespawnEntity = new Server_ConCommand('char_respawn');
const HumanoidDescription_Default = new Instance('HumanoidDescription', Folder_HumanoidDescriptions);
HumanoidDescription_Default.Name = 'DefaultHumanoidDescription';

PhysicsService.RegisterCollisionGroup('CharacterEntity');
PhysicsService.RegisterCollisionGroup('CharacterModel');

PhysicsService.CollisionGroupSetCollidable('CharacterEntity', 'CharacterModel', false);
PhysicsService.CollisionGroupSetCollidable('CharacterModel', 'CharacterModel', false);
PhysicsService.CollisionGroupSetCollidable('CharacterModel', 'Default', false);

//ANCHOR - CVars
const cvar_default_maxhealth = new CVar('char_starting_maxhealth', 150, '');
const cvar_default_health = new CVar('char_starting_health', cvar_default_maxhealth.value, '');

const DefaultCharacterCollision = new Instance('Part') as CharacterCollision;
DefaultCharacterCollision.Size = new Vector3(2, 5, 2);
DefaultCharacterCollision.Transparency = 0.5;
DefaultCharacterCollision.CastShadow = false;
DefaultCharacterCollision.CustomPhysicalProperties = new PhysicalProperties(1, 1, 0, 0, 100);
DefaultCharacterCollision.Anchored = true;
DefaultCharacterCollision.CFrame = new CFrame(0, 10e8, 0);
DefaultCharacterCollision.Name = '';
DefaultCharacterCollision.CollisionGroup = 'CharacterEntity';

const gyro = new Instance('BodyGyro', DefaultCharacterCollision);
gyro.CFrame = new CFrame();
gyro.MaxTorque = new Vector3(10e99, 10e99, 10e99);

// vforce attachment
const main_attach = new Instance('Attachment', DefaultCharacterCollision);
main_attach.Name = 'MainAttachment';

// camera attachment
const cam_attach = new Instance('Attachment', DefaultCharacterCollision);
cam_attach.Position = new Vector3(0, 2, 0);
cam_attach.Name = 'CameraAttachment';

const foot_attach = new Instance('Attachment', DefaultCharacterCollision);
foot_attach.Position = new Vector3(0, 4.5, 0);
foot_attach.Name = 'FootAttachment';

declare global {
	interface CharacterCollision extends Part {
		CameraAttachment: Attachment;
		MainAttachment: Attachment;
		FootAttachment: Attachment;
	}
	interface CharacterLocalInfo {
		CollisionBox: CharacterCollision;
		Alive: boolean;
		Health: number;
		MaxHealth: number;
		Inventory: {
			Weapons: BaseWeaponInfo[];
			Generic: BaseItem[];
		};
		EquippedWeapon: string | undefined;
	}

	interface CharacterReplicatedInfo {
		Alive: boolean;
		CollisionBox: CharacterCollision;
		Angle: Vector2;
		Position: Vector3;
		HumanoidDescription: HumanoidDescription;

		EquippedWeapon: BaseWeaponInfo | undefined;
	}

	interface BaseCharacterController {
		readonly id: string;
		Info: {
			Controlling: PlayerMonitor | undefined;
			Description: HumanoidDescription | undefined;
			CollisionBox: CharacterCollision;

			Alive: boolean;
			Health: number;
			HealthMax: number;
			Angle: Vector2;

			Inventory: {
				Weapons: BaseWeaponInfo[];
				Generic: BaseItem[];
			};
			EquippedWeapon: string | undefined;
		};

		Events: {
			Damaged: LocalSignal<[amount: number]>;
			Died: LocalSignal<[Player: PlayerMonitor | undefined]>;
		};

		Damage(amount: number): void;
		Kill(): void;
		Spawn(): void;
		Assign(Info: PlayerMonitor): void;
		Unassign(): void;

		// network
		NotifyController(): void;
		NotifyReplicated(): void;
		GenerateLocalInfo(): CharacterLocalInfo;
		GenerateReplicatedInfo(): CharacterReplicatedInfo;
	}

	interface ClinetInventoryInfo {
		Weapons: BaseWeaponInfo[];
		Generic: BaseItem[];
		EquippedWeapon: string | undefined;
	}
}

//ANCHOR - CharacterController
class CharacterController implements BaseCharacterController {
	readonly id = tostring(Folder_CharacterCollisions.GetChildren().size() + 1); //GenerateString(math.random(10, 20));

	private PInfo = {
		identifier: RunService.IsStudio()
			? 'character_' + tostring(Folder_CharacterCollisions.GetChildren().size() + 1)
			: GenerateString(math.random(10, 20)),
	};

	Info = {
		Controlling: undefined as PlayerMonitor | undefined,
		Description: HumanoidDescription_Default as HumanoidDescription | undefined,
		CollisionBox: this.CreateCollisionBox(),

		Alive: false,
		Health: 0,
		HealthMax: cvar_default_maxhealth.value,

		Angle: new Vector2(),

		Inventory: {
			Weapons: [] as BaseWeaponInfo[],
			Generic: [] as BaseItem[],
		},
		EquippedWeapon: undefined as string | undefined,
	};

	Events = {
		Damaged: new LocalSignal<[amount: number]>(),
		Died: new LocalSignal<[Controller: PlayerMonitor | undefined]>(),
	};

	private CreateCollisionBox() {
		const cbox = DefaultCharacterCollision.Clone() as CharacterCollision;
		cbox.Parent = Folder_CharacterCollisions;
		cbox.Name = this.PInfo.identifier;

		cbox.Destroying.Connect(() => {
			Signals.ConsoleDebug.Fire(cbox.Name, 'Died.');
			this.Kill();
			this.Info.CollisionBox = this.CreateCollisionBox();
		});

		return cbox;
	}

	constructor() {}

	Damage(amount: number) {
		if (this.Info.Controlling === undefined) return;
		this.Info.Health = math.clamp(this.Info.Health - amount, 0, this.Info.HealthMax);
		if (this.Info.Health <= 0 && this.Info.Alive) this.Kill();
		else {
			this.Events.Damaged.Fire(amount);
			this.NotifyController();
		}
	}

	Kill() {
		this.Info.Alive = false;
		this.Info.Health = 0;
		this.Events.Died.Fire(this.Info.Controlling);

		this.NotifyController();
		this.NotifyReplicated();

		this.Unassign();

		this.Info.CollisionBox.Anchored = true;
		this.Info.CollisionBox.CFrame = new CFrame(0, 10e8, 0);
	}

	Spawn() {
		if (this.Info.Controlling === undefined || this.Info.CollisionBox.GetNetworkOwner() === undefined) {
			Signals.ConsoleDebug.Fire('Spawn method requires one user controlling');
			print('ControllerId:', this.id);
			return;
		}

		this.Info.CollisionBox.Anchored = true;

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

		this.Info.CollisionBox.CFrame = Spawn_Location;
		this.Info.CollisionBox.Anchored = false;
		if (this.Info.Controlling !== undefined) this.Info.CollisionBox.SetNetworkOwner(this.Info.Controlling.Instance);

		this.Info.HealthMax = cvar_default_maxhealth.value;
		this.Info.Health = math.clamp(cvar_default_health.value, 1, cvar_default_maxhealth.value);
		this.Info.Alive = true;

		//STUB - Give weapon
		const TestWeapon = Signals.Entities.CreateWeaponController.Call(
			GetDefaultWeaponList().find(info => {
				return info.Name === 'glock17';
			})!,
		);
		TestWeapon.StoredAmmo = 99;
		this.Info.Inventory.Weapons.insert(0, TestWeapon);
		//this.Info.EquippedWeapon = TestWeapon.Id;

		this.NotifyController();
		this.NotifyReplicated();
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
		this.Info.CollisionBox.Anchored = false;
		this.Info.CollisionBox.SetNetworkOwner(PlayerInfo.Instance);
	}

	Unassign() {
		this.Info.Controlling = undefined;
		this.Info.Description = HumanoidDescription_Default;
		this.Info.CollisionBox.Anchored = false;
		this.Info.CollisionBox.SetNetworkOwner();
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
		const Info: CharacterLocalInfo = {
			Alive: this.Info.Alive,
			Health: this.Info.Health,
			MaxHealth: this.Info.HealthMax,
			CollisionBox: this.Info.CollisionBox,
			Inventory: this.Info.Inventory,
			EquippedWeapon: this.Info.EquippedWeapon,
		};
		return Info;
	}

	GenerateReplicatedInfo(): CharacterReplicatedInfo {
		return {
			Alive: this.Info.Alive,
			CollisionBox: this.Info.CollisionBox,
			Angle: this.Info.Angle,
			Position: this.Info.CollisionBox.CFrame.Position,
			HumanoidDescription: HumanoidDescription_Default, // TODO Handle different skins
			EquippedWeapon: this.Info.Inventory.Weapons.find(info => {
				return info.Id === this.Info.EquippedWeapon;
			}),
		};
	}
	//!SECTION
}

// create 5 controllers above maxplayers
for (let index = 0; index < Players.MaxPlayers + 5; index++) {
	const Controller = new CharacterController();
	List_CharacterControllers.insert(0, Controller);

	Controller.Events.Died.Connect(Monitor => {
		if (Monitor === undefined) return;
		Signals.ConsoleDebug.Fire(Monitor.Instance.DisplayName, 'died.');
	});
}
List_CharacterControllers.sort((a, b) => {
	return a.id < b.id;
});

//ANCHOR - Respawning
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
	controller.Info.CollisionBox.SetNetworkOwner(MonitorData.Instance); // needs to be set manually for some reason
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

Signals.Entities.GetCharacterFromUserId.Handle = userid => {
	return List_CharacterControllers.find(controller => {
		return controller.Info.Controlling?.UserId === userid;
	});
};

const CachedCharacterCollisions = new Util.CacheInstance<CharacterCollision>(
	DefaultCharacterCollision,
	List_CharacterControllers.size(),
);
Signals.Entities.GetCharacterCollisionBoxClone.Handle = () => {
	return CachedCharacterCollisions;
};

Signals.Entities.GetCharacterFromCollision.Handle = Part => {
	return List_CharacterControllers.find(controller => {
		return controller.Info.CollisionBox === Part;
	});
};
//!SECTION

//SECTION - Default component stuff
class Component implements BaseServerComponent {
	constructor() {}
	Start(): void {}
}

export function Init() {
	return new Component();
}
//!SECTION
