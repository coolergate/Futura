//========= Copyright GGC Studios, All rights reserved. ============//
// Purpose: Manage entities in the game world 						//
//==================================================================//

import Signals from './providers/signals';
import { Folders, EntityNetwork } from 'shared/global_resources';
import Signal from '@rbxts/signal';
import GenerateString from 'shared/modules/randomstring';

const Players = game.GetService('Players');
const StarterPlayer = game.GetService('StarterPlayer');

const Client_InfoChanged = EntityNetwork.Server.Get('EntityInfoChanged');
const Client_RespawnRequest = EntityNetwork.Server.Get('RetrieveNewEntity');
const Client_PlayerEntitySpawned = EntityNetwork.Server.Get('PlayerEntitySpawned');

const PlrEntitiesList = new Map<string, PlayerEntityController>();

const PlayersCollisionModels = new Instance('Folder', Folders.World.Entities);
PlayersCollisionModels.Name = 'PlayersCollisionModels';

declare global {
	interface PlayerEntityInfo {
		Id: string;
		Alive: boolean;
		Health: number;
		MaxHealth: number;
		CollisionBox: PlayerCollisionBox;
	}
	interface PlayerEntityInfoQuick {
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
	}
	type EntityType = 'Player';
}

class PlayerEntityController {
	IsAlive = false;
	Health = 150;
	MaxHealth = 150;

	UserId = undefined as number | undefined;
	readonly Id = GenerateString(10);
	readonly CollisionBox: PlayerCollisionBox;
	readonly TookDamage = new Signal<(amount: number) => void>();
	readonly EntityDied = new Signal();

	constructor() {
		const CustomPhysicalProperties = new PhysicalProperties(1, 0.25, 0, 1, 100);

		this.CollisionBox = new Instance('Part', PlayersCollisionModels) as PlayerCollisionBox;
		this.CollisionBox.Size = new Vector3(2, 5, 2);
		this.CollisionBox.CanTouch = false;
		this.CollisionBox.Transparency = 0.5;
		this.CollisionBox.Name = this.Id;
		this.CollisionBox.CustomPhysicalProperties = CustomPhysicalProperties;

		const MainAttachment = new Instance('Attachment', this.CollisionBox);
		MainAttachment.Name = 'MainAttachment';

		const CameraAttachment = new Instance('Attachment', this.CollisionBox);
		CameraAttachment.Position = new Vector3(0, 2, 0);
		CameraAttachment.Name = 'CameraAttachment';
	}

	TakeDamage(amount: number) {
		this.Health = math.clamp(this.Health - amount, 0, this.MaxHealth);
		this.TookDamage.Fire(amount);

		if (this.Health <= 0 && this.IsAlive) {
			this.IsAlive = false;
			this.EntityDied.Fire();
		}

		if (this.UserId !== undefined) {
			const equivalent_player = Players.GetPlayerByUserId(this.UserId);
			if (equivalent_player) {
				Client_InfoChanged.SendToPlayer(equivalent_player, GenerateInfoFromPlayerController(this));
			}
		}
	}

	Reset() {
		this.Health = this.MaxHealth;
		this.IsAlive = true;
		this.UserId = undefined;

		this.CollisionBox.SetNetworkOwner();
		this.CollisionBox.Anchored = true;
		this.CollisionBox.CFrame = new CFrame(0, 10000, 0);
	}
}

// Create the players entity controllers
// Get server size and add five extra, it might happen that roblox will let more players
// to join the server no matter its max size
/*
for (let index = 0; index < Players.MaxPlayers + 5; index++) {
	const Controller = new PlayerEntityController();
	PlrEntitiesList.set(Controller.Id, Controller);
}*/

const Controller = new PlayerEntityController();
PlrEntitiesList.set(Controller.Id, Controller);

function GenerateInfoFromPlayerController(controller: PlayerEntityController): PlayerEntityInfo {
	return {
		Id: controller.Id,
		Alive: controller.IsAlive,
		Health: controller.Health,
		MaxHealth: controller.MaxHealth,
		CollisionBox: controller.CollisionBox,
	};
}

// When a player sends a respawn request, the server will search for an avaiable controller
// If none is found then wait until one is free
Client_RespawnRequest.SetCallback((player) => {
	let Controller: PlayerEntityController | undefined;
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

	Client_PlayerEntitySpawned.SendToAllPlayersExcept(
		player,
		Controller.Id,
		descriptions_folder.FindFirstChild(tostring(player.UserId)) as HumanoidDescription | undefined,
	);
	return GenerateInfoFromPlayerController(Controller);
});

Signals.GetPlayerDataFromUserId.OnInvoke = (userid: number) => {
	let reply: PlayerEntityInfo | undefined;
	PlrEntitiesList.forEach((controller) => {
		if (reply) return;
		if (controller.UserId === userid) {
			GenerateInfoFromPlayerController(controller);
		}
	});
	return reply;
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
