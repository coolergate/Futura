//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Manage entities in the game.

import Signals from '../providers/signals';
import { ConVar } from 'shared/components/vars';
import { Folders } from 'shared/global_resources';
import { LocalSignal } from 'shared/local_network';
import Signal from '@rbxts/signal';
import GenerateString from 'shared/modules/randomstring';

const Players = game.GetService('Players');
const StarterPlayer = game.GetService('StarterPlayer');

//=============================================================================
// Remotes & Signals
//=============================================================================
import Network from 'shared/network';
const Client_InfoChanged = Network.Ent_Character_InfoChanged;
const Client_RespawnRequest = Network.Ent_Character_RequestRespawn;
const Client_PlayerEntitySpawned = Network.Ent_Character_Spawned;

//=============================================================================
// ConVars & Statements
//=============================================================================
const PlrEntitiesList = new Map<string, PlayerEntity>();
const PlayersCollisionModels = new Instance('Folder', Folders.World.Entities);
PlayersCollisionModels.Name = 'PlayersCollisionModels';

//=============================================================================
// Entities constructor
//=============================================================================
declare global {
	type EntityType = 'Player' | '';
	type BaseEntityAttributes = 'NO_DRAW' | 'NO_PHYSICS' | 'NO_COLL' | 'PLR_CONTROL';
	type BaseEntityLogic = {
		readonly Id: string;
		readonly Type: EntityType;
		readonly IntervalThinkTime: number;
		Attributes: BaseEntityAttributes[];
		Spawn(): void;
		Think(): void;
		Death(): void;
		Reset(): void;
		OnDamage(amount: number): void;
		Damaged: LocalSignal<[amount: number]>;
		Died: LocalSignal<[]>;
	};
}
class BaseEntity implements BaseEntityLogic {
	Id = GenerateString(math.random(10, 20));
	Type: EntityType = '';
	IntervalThinkTime = 0.03;
	Attributes: BaseEntityAttributes[] = [];
	Died = new LocalSignal();
	Damaged = new LocalSignal<[amount: number]>();
	constructor() {
		coroutine.wrap(() => {
			while (this.Id !== undefined) {
				this.Think();
				task.wait(this.IntervalThinkTime);
			}
		})();
	}
	Spawn(): void {}
	Think(): void {}
	OnDamage(amount: number): void {}
	Death(): void {}
	Reset(): void {}
}

//=============================================================================
// Player entities
//=============================================================================
declare global {
	interface PlayerEntityInfo_1 {
		// server
		Id: string;
		Alive: boolean;
		Health: number;
		MaxHealth: number;
		CollisionBox: PlayerCollisionBox;
	}
	interface PlayerEntityInfo_2 {
		// client
		Alive: boolean;
		Id: string;
		CollisionBox: PlayerCollisionBox;

		CharacterModelInfo: {
			Angle: Vector2;
			CurrentWeapon: string;
			Description: HumanoidDescription;
		};
	}
	interface PlayerCollisionBox extends Part {
		CameraAttachment: Attachment;
		MainAttachment: Attachment;
		Force: LinearVelocity;
	}
}
function CreatePlayerCollisionBox(Id: string): PlayerCollisionBox {
	const CustomPhysicalProperties = new PhysicalProperties(0.5, 0.25, 0, 1, 100);

	const CollisionBox = new Instance('Part', PlayersCollisionModels) as PlayerCollisionBox;
	CollisionBox.Size = new Vector3(2, 5, 2);
	CollisionBox.CanTouch = false;
	CollisionBox.Transparency = 0.5;
	CollisionBox.Name = Id;
	CollisionBox.CustomPhysicalProperties = CustomPhysicalProperties;

	const MainAttachment = new Instance('Attachment', CollisionBox);
	MainAttachment.Name = 'MainAttachment';

	const CameraAttachment = new Instance('Attachment', CollisionBox);
	CameraAttachment.Position = new Vector3(0, 2, 0);
	CameraAttachment.Name = 'CameraAttachment';

	const force = new Instance('LinearVelocity', CollisionBox);
	force.Enabled = false;
	force.Attachment0 = MainAttachment;
	force.VelocityConstraintMode = Enum.VelocityConstraintMode.Line;
	force.Name = 'Force';
	force.Enabled = true;

	return CollisionBox;
}
class PlayerEntity extends BaseEntity implements BaseEntityLogic, PlayerEntityInfo_1 {
	readonly Id = GenerateString(math.random(10, 20));
	readonly Type = 'Player';
	readonly Attributes: BaseEntityAttributes[] = ['PLR_CONTROL'];
	readonly IntervalThinkTime: number = 0.5;

	Alive = false;
	Armor = 0;
	Health = 150;
	MaxHealth = 150;

	UserId = undefined as number | undefined;
	readonly CollisionBox: PlayerCollisionBox;

	Damaged = new LocalSignal<[amount: number]>();
	Died = new LocalSignal();

	constructor() {
		super();
		this.CollisionBox = CreatePlayerCollisionBox(this.Id);
	}
	Spawn(): void {
		this.MaxHealth = 150;
		this.Health = this.MaxHealth;
		this.Armor = 0;
		this.Alive = true;

		this.CollisionBox.Anchored = false;
		this.CollisionBox.SetNetworkOwner();
		this.CollisionBox.Anchored = true;
		this.CollisionBox.CFrame = new CFrame(0, 10000, 0);
	}
	Think(): void {
		// check if the player is still in the server
		if (this.UserId === undefined) return;
		const equivalent_player = Players.GetPlayerByUserId(this.UserId);
		if (!equivalent_player) {
			this.UserId = undefined;
			this.Alive = false;
			this.Health = 0;
			this.MaxHealth = 0;
			this.Armor = 0;
			return;
		}

		if (this.Health > this.MaxHealth) this.Health--;
	}
	OnDamage(amount: number): void {
		this.Health = math.clamp(this.Health - amount, 0, this.MaxHealth + 50);
		this.Damaged.Fire(amount);

		if (this.Health <= 0 && this.Alive) this.Death();
	}
	Death(): void {
		if (this.UserId !== undefined) {
			const equivalent_player = Players.GetPlayerByUserId(this.UserId);
			if (equivalent_player) {
				Client_InfoChanged.PostClient([equivalent_player], GenerateInfoFromPlayerController(this));
			}
		}

		this.UserId = undefined;
		this.Alive = false;
		this.CollisionBox.SetNetworkOwner();
		this.Died.Fire();
	}
	Reset(): void {
		this.UserId = undefined;
		this.Spawn();
	}
}

// Get server size and add five extra, it might happen that roblox will let more players
// to join the server no matter it's max size
for (let index = 0; index < Players.MaxPlayers + 5; index++) {
	const Controller = new PlayerEntity();
	Controller.Reset();
	PlrEntitiesList.set(Controller.Id, Controller);
}

function GenerateInfoFromPlayerController(controller: PlayerEntity): PlayerEntityInfo_1 {
	return {
		Id: controller.Id,
		Alive: controller.Alive,
		Health: controller.Health,
		MaxHealth: controller.MaxHealth,
		CollisionBox: controller.CollisionBox,
	};
}

// When a player sends a respawn request, the server will search for an avaiable controller
// If none is found then wait until one is free
Client_RespawnRequest.OnServerInvoke = player => {
	let Controller: PlayerEntity | undefined;
	do {
		let cancel_search = false;
		PlrEntitiesList.forEach((controller, key) => {
			if (controller.UserId === player.UserId) {
				cancel_search = true;
				return;
			}

			if (controller.UserId === undefined) {
				Controller = controller;
			}
		});
		if (cancel_search) break;
	} while (Controller === undefined);
	if (!Controller) return;

	Controller.Reset();

	// Random spawn location
	const Children = Folders.World.Map.Spawns.GetChildren();
	let SpawnLocation = new CFrame(0, 10, 0);
	if (!Children.isEmpty()) {
		let found_spawn_location = false;
		do {
			const result = Children[math.random(0, Children.size())];
			if (!result || !result.IsA('BasePart')) continue;

			SpawnLocation = result.CFrame;
			found_spawn_location = true;
		} while (!found_spawn_location);
	}

	Controller.CollisionBox.CFrame = SpawnLocation;
	Controller.CollisionBox.Anchored = false;
	Controller.CollisionBox.SetNetworkOwner(player);

	Client_PlayerEntitySpawned.PostClient(
		[player],
		Controller.Id,
		descriptions_folder.FindFirstChild(tostring(player.UserId)) as HumanoidDescription | undefined,
	);
	return GenerateInfoFromPlayerController(Controller);
};

// Create a player's humanoid description when they join
const descriptions_folder = new Instance('Folder', Folders.Server.Objects);
Signals.PlayerAdded.Connect((id, data) => {
	const description = Players.GetHumanoidDescriptionFromUserId(id);
	description.Parent = descriptions_folder;
	description.Name = tostring(id);
});
Signals.PlayerRemoved.Connect((id, data) => {
	descriptions_folder.FindFirstChild(tostring(id))?.Destroy();
});
