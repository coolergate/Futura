// Author: coolergate#2031
// Purpose: Create and manage entities
//==================================================================//

import GenerateString from 'shared/modules/randomstring';
import { LocalSignal } from 'shared/local_network';
import { ConVar } from 'shared/components/vars';
import Signals from 'server/providers/signals';
import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import Network from 'shared/network';
import { client_command } from 'server/providers/client_cmds';

// ANCHOR Folders
const characters_folder = Folders.GetFolder('characters', Folders.Entities);

//SECTION Character entity
const created_controllers = new Array<CharacterController>();
const respawn_req = new client_command<[], void>('char_respawn');

declare global {
	interface ent_characterColl extends Part {
		CameraAttachment: Attachment;
		MainAttachment: Attachment;
	}
	interface ent_CharacterInfo {
		id: string;
		alive: boolean;
		health: number;
		health_max: number;

		collisionbox: ent_characterColl;
	}
}

class CharacterController {
	readonly ent_id = tostring(characters_folder.GetChildren().size() + 1); //GenerateString(math.random(10, 20));
	readonly ent_collisionbox: ent_characterColl;

	ent_owner = undefined as number | undefined;
	ent_alive = true;
	ent_health = 150;
	ent_maxhealth = 150;

	// signals
	signal_damaged = new LocalSignal<[amount: number]>();
	signal_died = new LocalSignal<[UserId: number | undefined]>();

	// functions
	constructor() {
		// create collision box
		const collision_box = new Instance('Part', characters_folder) as ent_characterColl;
		collision_box.Size = new Vector3(2, 5, 2);
		collision_box.Transparency = 0.5;
		collision_box.CustomPhysicalProperties = new PhysicalProperties(1, 1, 0, 0, 100);
		collision_box.Anchored = true;
		collision_box.CFrame = new CFrame(0, 10e8, 0);
		collision_box.Name = Services.RunService.IsStudio()
			? 'character_' + tostring(characters_folder.GetChildren().size() + 1)
			: GenerateString(math.random(10, 20), '§');

		// vforce attachment
		const attachment_1 = new Instance('Attachment', collision_box);
		attachment_1.Name = 'MainAttachment';

		// camera attachment
		const attachment_2 = new Instance('Attachment', collision_box);
		attachment_2.Position = new Vector3(0, 2, 0);
		attachment_2.Name = 'CameraAttachment';

		this.ent_collisionbox = collision_box;
	}

	Damage(amount: number) {
		if (this.ent_owner === undefined) return;
		this.ent_health = math.clamp(this.ent_health - amount, 0, this.ent_maxhealth);
		this.ent_health <= 0 && this.ent_alive ? this.Kill() : this.signal_damaged.Fire(amount);
	}

	Kill() {
		this.ent_alive = false;
		this.ent_health = 0;
		this.ent_collisionbox.Anchored = false;
		this.ent_collisionbox.SetNetworkOwner();
		this.ent_collisionbox.Anchored = true;
		this.signal_died.Fire(this.ent_owner);
		this.ent_owner = undefined;
	}

	Spawn(userid: number) {
		this.ent_alive = true;
		this.ent_health = this.ent_maxhealth;
		this.ent_owner = userid;
	}
}

function char_InfoFromController(controller: CharacterController): ent_CharacterInfo {
	return {
		id: controller.ent_id,
		alive: controller.ent_alive,
		health: controller.ent_health,
		health_max: controller.ent_maxhealth,
		collisionbox: controller.ent_collisionbox,
	};
}

// create 5 controllers above maxplayers
for (let index = 0; index < Services.Players.MaxPlayers + 5; index++) {
	const ent_player_controller = new CharacterController();
	created_controllers.insert(0, ent_player_controller);

	ent_player_controller.signal_damaged.Connect(amount => {
		if (ent_player_controller.ent_owner === undefined) return;
		const controller_owner = Services.Players.GetPlayerByUserId(ent_player_controller.ent_owner);
		if (!controller_owner) return;

		Network.entities.ent_Character.info_changed.PostClient(
			[controller_owner],
			char_InfoFromController(ent_player_controller),
		);
	});
	ent_player_controller.signal_died.Connect(previous_owner => {
		if (previous_owner === undefined) return;
		const controller_owner = Services.Players.GetPlayerByUserId(previous_owner);
		if (!controller_owner) return;

		Network.entities.ent_Character.info_changed.PostClient(
			[controller_owner],
			char_InfoFromController(ent_player_controller),
		);
	});
}
created_controllers.sort((a, b) => {
	return a.ent_id > b.ent_id;
});

// client respawn request
respawn_req.callback = player_data => {
	const player_instance = Services.Players.GetPlayerByUserId(player_data.UserId);
	if (player_instance === undefined) return;

	// search if the player already has a controller assigned
	if (
		created_controllers.find(controller => {
			return controller.ent_owner === player_data.UserId;
		})
	)
		return false;

	// loop search until a controller is avaiable
	// const controller = created_controllers.find(controller => {return controller.ent_owner === undefined});
	// if (controller === undefined) return false;
	// controller.Kill();
	// controller.Spawn(player_data.UserId);

	let controller: CharacterController | undefined;
	while (controller === undefined)
		for (let index = 0; index < created_controllers.size(); index++) {
			const element = created_controllers[index];
			if (element.ent_owner === undefined) controller = element;
			if (controller !== undefined) break;
		}

	controller.Kill();
	controller.Spawn(player_data.UserId);

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

	controller.ent_collisionbox.CFrame = Spawn_Location;
	controller.ent_collisionbox.Anchored = false;
	controller.ent_collisionbox.SetNetworkOwner(player_instance);

	Network.entities.ent_Character.info_changed.PostClient([player_instance], char_InfoFromController(controller));

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
