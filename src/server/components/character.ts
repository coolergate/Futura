// Author: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import GenerateString from 'shared/modules/randomstring';
import Network from 'shared/network';
import { ConVar } from 'shared/components/vars';
import { LocalSignal } from 'shared/local_network';
import Signals from 'server/providers/signals';

const Folder = new Instance('Folder', Services.Workspace);
Folder.Name = 'Characters';

declare global {
	interface PlayerCollisionModel extends Model {
		CollisionBox: Part & {
			CameraAttachment: Attachment;
			MainAttachment: Attachment;
		};
		Humanoid: Humanoid;
	}
	interface PlayerEntityInfo {
		Id: string;
		Alive: boolean;
		Health: number;
		MaxHealth: number;
		Model: PlayerCollisionModel;
	}
}

class PlayerEntityController {
	readonly Id = GenerateString(math.random(10, 20), '§');
	readonly CollisionModel: PlayerCollisionModel;

	UserId = undefined as number | undefined;
	Alive = true;
	Armor = 0;
	Health = 150;
	MaxHealth = 150;

	// signals
	Damaged = new LocalSignal<[amount: number]>();
	Died = new LocalSignal<[UserId: number | undefined]>();

	// functions
	constructor() {
		// create collision box
		const CustomPhysicalProperties = new PhysicalProperties(0.5, 0.25, 0, 1, 100);
		const CollisionBox = new Instance('Part');
		CollisionBox.Size = new Vector3(2, 5, 2);
		CollisionBox.Transparency = 0.5;
		CollisionBox.CustomPhysicalProperties = CustomPhysicalProperties;
		CollisionBox.Anchored = true;
		CollisionBox.CFrame = new CFrame(0, 10e8, 0);
		CollisionBox.Name = 'CollisionBox';

		const MainAttachment = new Instance('Attachment', CollisionBox);
		MainAttachment.Name = 'MainAttachment';

		const CameraAttachment = new Instance('Attachment', CollisionBox);
		CameraAttachment.Position = new Vector3(0, 2, 0);
		CameraAttachment.Name = 'CameraAttachment';

		const CollisionModel = new Instance('Model', Folder) as PlayerCollisionModel;
		CollisionModel.Name = this.Id;
		CollisionBox.Parent = CollisionModel;
		CollisionModel.PrimaryPart = CollisionBox;

		const Humanoid = new Instance('Humanoid', CollisionModel);
		Humanoid.Health = 1;
		Humanoid.MaxHealth = 1;
		Humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None;
		Humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff;
		Humanoid.UseJumpPower = true;
		Humanoid.WalkSpeed = Services.StarterPlayer.CharacterWalkSpeed;
		Humanoid.JumpPower = Services.StarterPlayer.CharacterJumpPower;

		this.CollisionModel = CollisionModel;
	}

	Damage(amount: number) {
		if (this.UserId === undefined) return;
		this.Health = math.clamp(this.Health - amount, 0, this.MaxHealth);
		this.Health <= 0 && this.Alive ? this.Kill() : this.Damaged.Fire(amount);
	}

	Kill() {
		this.Alive = false;
		this.Health = 0;
		this.CollisionModel.CollisionBox.Anchored = false;
		this.CollisionModel.CollisionBox.SetNetworkOwner();
		this.CollisionModel.CollisionBox.Anchored = true;
		this.Died.Fire(this.UserId);
		this.UserId = undefined;
	}

	Spawn(userid: number) {
		this.Alive = true;
		this.Health = this.MaxHealth;
		this.Armor = 0;
		this.UserId = userid;
	}
}

class Component implements BaseServerComponent {
	Controllers = new Map<string, PlayerEntityController>();

	CVars = {
		DisableRespawnWave: new ConVar('sv_disable_respawn_waves', false, ''),
	};

	Network = {
		RespawnRequest: Network.PlrEntity_RequestRespawn,
		InfoChanged: Network.PlrEntity_LocalInfoChanged,
	};

	constructor() {
		for (let index = 0; index < Services.Players.MaxPlayers + 5; index++) {
			const Controller = new PlayerEntityController();
			this.Controllers.set(Controller.Id, Controller);

			Controller.Damaged.Connect(amount => {
				if (Controller.UserId === undefined) return;
				const controller_owner = Services.Players.GetPlayerByUserId(Controller.UserId);
				if (!controller_owner) return;

				this.Network.InfoChanged.PostClient([controller_owner], this.GenerateInfoFromController(Controller));
			});
			Controller.Died.Connect(previous_owner => {
				if (previous_owner === undefined) return;
				const controller_owner = Services.Players.GetPlayerByUserId(previous_owner);
				if (!controller_owner) return;

				this.Network.InfoChanged.PostClient([controller_owner], this.GenerateInfoFromController(Controller));
			});
		}

		this.Network.RespawnRequest.OnServerInvoke = player => {
			// search if the player already has a controller assigned
			let UserHasController = false;
			this.Controllers.forEach(controller => {
				if (UserHasController) return;
				if (controller.UserId === player.UserId) UserHasController = true;
			});
			if (UserHasController) return;

			// loop search until a controller is avaiable
			let AvaiableController: PlayerEntityController | undefined;
			do {
				this.Controllers.forEach(controller => {
					if (AvaiableController !== undefined) return;
					if (controller.UserId !== undefined) return;

					if (controller.UserId === undefined) {
						controller.Kill();
						controller.Spawn(player.UserId);
						AvaiableController = controller;
					}
				});
				if (AvaiableController) break;
			} while (AvaiableController === undefined);

			// Random spawn location
			const Children = Folders.Workspace.Map.func_spawn.GetChildren();
			let AssignedSpawnLocation = new CFrame(0, 10, 0);
			if (!Children.isEmpty()) {
				let found_spawn_location = false;
				do {
					const result = Children[math.random(0, Children.size())];
					if (!result || !result.IsA('BasePart')) continue;

					AssignedSpawnLocation = result.CFrame;
					found_spawn_location = true;
					break;
				} while (found_spawn_location === false);
			}

			AvaiableController.CollisionModel.CollisionBox.CFrame = AssignedSpawnLocation;
			AvaiableController.CollisionModel.CollisionBox.Anchored = false;
			AvaiableController.CollisionModel.CollisionBox.SetNetworkOwner(player);

			// TODO alert all players when a new entity spawns in

			return this.GenerateInfoFromController(AvaiableController);
		};
	}

	GenerateInfoFromController(controller: PlayerEntityController): PlayerEntityInfo {
		return {
			Id: controller.Id,
			Alive: controller.Alive,
			Health: controller.Health,
			MaxHealth: controller.MaxHealth,
			Model: controller.CollisionModel,
		};
	}

	Start(): void {}
}

// ! Default args
export function Init() {
	return new Component();
}
export const InitOrder = 0;
