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

//SECTION Character entity
const ent_CharacterFolderHolder = new Instance('Folder', Services.Workspace);
ent_CharacterFolderHolder.Name = 'Characters';

const BaseDefaultBox = new Instance('Part');
BaseDefaultBox.Size = new Vector3(2, 5, 2);
BaseDefaultBox.Transparency = 0.5;
BaseDefaultBox.CustomPhysicalProperties = new PhysicalProperties(0.5, 0.25, 0, 1, 100);
BaseDefaultBox.Anchored = true;
BaseDefaultBox.CFrame = new CFrame(0, 10e8, 0);
BaseDefaultBox.Name = 'Base';

const Attachment1 = new Instance('Attachment', BaseDefaultBox);
Attachment1.Name = 'MainAttachment';

// camera attachment
const Attachment2 = new Instance('Attachment', BaseDefaultBox);
Attachment2.Position = new Vector3(0, 2, 0);
Attachment2.Name = 'CameraAttachment';

const DefaultCollisionModel = new Instance('Model') as ent_CharacterModel;
DefaultCollisionModel.Name = '';
BaseDefaultBox.Parent = DefaultCollisionModel;
DefaultCollisionModel.PrimaryPart = BaseDefaultBox;

const created_controllers = new Map<string, CharacterController>();
const respawn_req = new client_command<[], void>('char_respawn');

declare global {
	interface ent_CharacterModel extends Model {
		Base: Part & {
			CameraAttachment: Attachment;
			MainAttachment: Attachment;
		};
	}
	interface ent_CharacterInfo {
		Id: string;
		Alive: boolean;
		Health: number;
		MaxHealth: number;
		Model: ent_CharacterModel;
	}
}

class CharacterController {
	readonly ent_id = tostring(ent_CharacterFolderHolder.GetChildren().size() + 1); //GenerateString(math.random(10, 20));
	readonly ent_model: ent_CharacterModel;

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
		const cmodel = DefaultCollisionModel.Clone();
		cmodel.Parent = ent_CharacterFolderHolder;
		cmodel.Name = tostring(ent_CharacterFolderHolder.GetChildren().size() + 1);

		this.ent_model = cmodel;
	}

	Damage(amount: number) {
		if (this.ent_owner === undefined) return;
		this.ent_health = math.clamp(this.ent_health - amount, 0, this.ent_maxhealth);
		this.ent_health <= 0 && this.ent_alive ? this.Kill() : this.signal_damaged.Fire(amount);
	}

	Kill() {
		this.ent_alive = false;
		this.ent_health = 0;
		this.ent_model.Base.Anchored = false;
		this.ent_model.Base.SetNetworkOwner();
		this.ent_model.Base.Anchored = true;
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
		Id: controller.ent_id,
		Alive: controller.ent_alive,
		Health: controller.ent_health,
		MaxHealth: controller.ent_maxhealth,
		Model: controller.ent_model,
	};
}

// create 5 controllers above maxplayers
for (let index = 0; index < Services.Players.MaxPlayers + 5; index++) {
	const ent_player_controller = new CharacterController();
	created_controllers.set(ent_player_controller.ent_id, ent_player_controller);

	ent_player_controller.signal_damaged.Connect(amount => {
		if (ent_player_controller.ent_owner === undefined) return;
		const controller_owner = Services.Players.GetPlayerByUserId(ent_player_controller.ent_owner);
		if (!controller_owner) return;

		Network.ent_plr_changed.PostClient([controller_owner], char_InfoFromController(ent_player_controller));
	});
	ent_player_controller.signal_died.Connect(previous_owner => {
		if (previous_owner === undefined) return;
		const controller_owner = Services.Players.GetPlayerByUserId(previous_owner);
		if (!controller_owner) return;

		Network.ent_plr_changed.PostClient([controller_owner], char_InfoFromController(ent_player_controller));
	});
}

// client respawn request
respawn_req.callback = player_data => {
	const player_instance = Services.Players.GetPlayerByUserId(player_data.UserId);
	if (player_instance === undefined) return;

	// search if the player already has a controller assigned
	let user_has_controller = false;
	created_controllers.forEach(controller => {
		if (user_has_controller) return;
		if (controller.ent_owner === player_data.UserId) user_has_controller = true;
	});
	if (user_has_controller) return false;

	// loop search until a controller is avaiable
	let AvaiableController: CharacterController | undefined;
	do {
		created_controllers.forEach(Char_Controller => {
			if (AvaiableController !== undefined) return;
			if (Char_Controller.ent_owner !== undefined) return;

			if (Char_Controller.ent_owner === undefined) {
				Char_Controller.Kill();
				Char_Controller.Spawn(player_data.UserId);
				AvaiableController = Char_Controller;
			}
		});
		if (AvaiableController) break;
	} while (AvaiableController === undefined);

	// Random spawn location
	const spawn_children = Folders.Workspace.Map.func_spawn.GetChildren();
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

	AvaiableController.ent_model.Base.CFrame = Spawn_Location;
	AvaiableController.ent_model.Base.Anchored = false;
	AvaiableController.ent_model.Base.SetNetworkOwner(player_instance);

	Network.entities.ent_Character.InfoChanged.PostClient(
		[player_instance],
		char_InfoFromController(AvaiableController),
	);

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
