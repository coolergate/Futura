// Author: coolergate#2031
// Purpose: Create and manage entities
//==================================================================//

import GenerateString from 'shared/randomstring';
import { LocalSignal } from 'shared/local_network';
import { CVar, Server_ConCommand } from 'shared/vars';
import Signals from 'server/providers/signals';
import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import Network from 'shared/network';

// ANCHOR Folders
const Folder_CharacterCollisions = Folders.CharacterEntity.Collision;
const Folder_HumanoidDescriptions = Folders.GetFolder('HumanoidDescriptions', Folders.Entities);

//SECTION Character entity
const List_CharacterControllers = new Array<CharacterController>();
const Command_RespawnEntity = new Server_ConCommand('char_respawn');
const HumanoidDescription_Default = new Instance('HumanoidDescription', Folder_HumanoidDescriptions);
HumanoidDescription_Default.Name = 'DefaultHumanoidDescription';

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
	}

	interface CharacterReplicatedInfo {
		CollisionBox: CharacterCollision;
		Angle: CFrame;
		Position: Vector3;
		AppliedSkin: string;
	}

	// sent from client
	interface CharacterInfoReport {
		Angle: CFrame;
		Position: Vector3;
	}
}

// ANCHOR CharacterController
class CharacterController {
	readonly id = tostring(Folder_CharacterCollisions.GetChildren().size() + 1); //GenerateString(math.random(10, 20));
	collisionbox: CharacterCollision;

	private PInfo = {
		identifier: Services.RunService.IsStudio()
			? 'character_' + tostring(Folder_CharacterCollisions.GetChildren().size() + 1)
			: GenerateString(math.random(10, 20)),
	};

	Info = {
		Controlling: undefined as PlayerMonitor | undefined,
		Description: HumanoidDescription_Default as HumanoidDescription | undefined,

		Alive: false,
		Health: 0,
		HealthMax: cvar_default_maxhealth.value,
	};

	// signals
	signal_damaged = new LocalSignal<[amount: number]>();
	signal_died = new LocalSignal<[Controller: PlayerMonitor | undefined]>();

	private CreateCollisionBox() {
		const cbox = new Instance('Part', Folder_CharacterCollisions) as CharacterCollision;
		cbox.Size = new Vector3(2, 5, 2);
		cbox.Transparency = 0.5;
		cbox.CustomPhysicalProperties = new PhysicalProperties(1, 1, 0, 0, 100);
		cbox.Anchored = true;
		cbox.CFrame = new CFrame(0, 10e8, 0);
		cbox.Name = this.PInfo.identifier;

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

		// if the collision box gets deleted, we'll make sure to create a replacement
		// probably will only happen when it falls of the world and gets deleted
		this.collisionbox.Destroying.Connect(() => {
			this.Kill();
		});
	}

	Damage(amount: number) {
		if (this.Info.Controlling === undefined) return;
		this.Info.Health = math.clamp(this.Info.Health - amount, 0, this.Info.HealthMax);
		this.Info.Health <= 0 && this.Info.Alive ? this.Kill() : this.signal_damaged.Fire(amount);
	}

	Kill() {
		this.Info.Alive = false;
		this.Info.Health = 0;
		this.signal_died.Fire(this.Info.Controlling);

		this.Unassign();

		this.collisionbox.Anchored = true;
		this.collisionbox.CFrame = new CFrame(0, 10e8, 0);
	}

	Spawn() {
		if (this.Info.Controlling === undefined || this.collisionbox.GetNetworkOwner() === undefined) {
			warn('Spawn method requires one user controlling');
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
	}

	Assign(PlayerInfo: PlayerMonitor) {
		const description =
			(Folder_HumanoidDescriptions.FindFirstChild(tostring(PlayerInfo.Instance)) as
				| HumanoidDescription
				| undefined) || Services.Players.GetHumanoidDescriptionFromUserId(PlayerInfo.UserId);
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
}

function GenerateCharacterInfo(controller: CharacterController): CharacterLocalInfo {
	return {
		Alive: controller.Info.Alive,
		Health: controller.Info.Health,
		MaxHealth: controller.Info.HealthMax,
		CollisionBox: controller.collisionbox,
	};
}

// create 5 controllers above maxplayers
for (let index = 0; index < Services.Players.MaxPlayers + 5; index++) {
	const Controller = new CharacterController();
	List_CharacterControllers.insert(0, Controller);

	Controller.signal_damaged.Connect(amount => {
		if (Controller.Info.Controlling === undefined) return;

		// send local info
		Network.Entities.Character.LocalInfoChanged.PostClient(
			[Controller.Info.Controlling.Instance],
			GenerateCharacterInfo(Controller),
		);

		// send global info
		Network.Entities.Character.LocalInfoChanged.PostAllClients(
			[Controller.Info.Controlling.Instance],
			GenerateCharacterInfo(Controller),
		);
	});
	Controller.signal_died.Connect(Monitor => {
		if (Monitor === undefined) return;

		Network.Entities.Character.LocalInfoChanged.PostClient([Monitor.Instance], GenerateCharacterInfo(Controller));
	});
}
List_CharacterControllers.sort((a, b) => {
	return a.id > b.id;
});

//ANCHOR Character respawning
//Network.CharacterRespawn.OnServerInvoke = Player => {
Command_RespawnEntity.OnInvoke = MonitorData => {
	//const MonitorData = Signals.GetDataFromPlayerId.Call(Player.UserId).await()[1] as PlayerMonitor | undefined;
	//if (!MonitorData) return;

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

	Network.Entities.Character.LocalInfoChanged.PostClient([MonitorData.Instance], GenerateCharacterInfo(controller));

	//TODO alert all players when a new entity spawns in
};

//!SECTION

//SECTION Default component stuff
class Component implements BaseServerComponent {
	constructor() {}
	Start(): void {}
}

// ! Default args
export function Init() {
	return new Component();
}
export const InitOrder = 0;

//!SECTION
