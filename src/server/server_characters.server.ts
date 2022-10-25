import Signal from '@rbxts/signal';
import Folders from 'shared/folders';
import Network from 'shared/network';
import Signals from './providers/signals';

declare global {
	interface BaseCharacter extends Model {
		Head: BasePart;
		Torso: BasePart;
		HumanoidRootPart: BasePart;
		['Left Arm']: BasePart;
		['Right Arm']: BasePart;
		['Left Leg']: BasePart;
		['Right Leg']: BasePart;
		Humanoid: Humanoid;
	}
	interface ClientCharacterInfo {
		Model: BaseCharacter;
		Info: {
			Health: number;
			MaxHealth: number;
			Position: Vector3;
			Angle: Vector2;
		};
	}
}

class CharController {
	Alive = true;
	Health = 150;
	MaxHealth = 150;

	PlayerUserId: number | undefined;
	readonly ID: number;
	readonly Model: BaseCharacter;

	readonly TookDamage = new Signal<(amount: number) => void>();
	readonly Died = new Signal();

	constructor(Id: number, Model: BaseCharacter) {
		this.ID = Id;
		this.Model = Model;
	}

	TakeDamage(amount: number) {
		this.Health = math.clamp(this.Health - amount, 0, this.MaxHealth);
		this.TookDamage.Fire(amount);

		if (this.Health === 0) {
			this.Alive = false;
			this.Died.Fire();
		}

		const equivalent_player = this.PlayerUserId !== undefined && Players.GetPlayerByUserId(this.PlayerUserId);
		if (equivalent_player) Client_CharacterUpdated.SendToPlayer(equivalent_player, GetClientInterface(this.ID));
	}

	Reset() {
		this.Health = 150;
		this.MaxHealth = 150;
		this.Alive = true;
		this.PlayerUserId = undefined;

		Signals.ClearInventoryFromCharacter.Fire(this.Model);

		const Humanoid = this.Model.WaitForChild('Humanoid') as Humanoid;
		const HumanoidRootPart = this.Model.WaitForChild('HumanoidRootPart') as BasePart;

		if (HumanoidRootPart.Anchored) HumanoidRootPart.Anchored = false;

		Humanoid.ApplyDescription(DefDescription);
		HumanoidRootPart.SetNetworkOwner();
		HumanoidRootPart.Anchored = true;
		HumanoidRootPart.CFrame = new CFrame(0, 10000, 0);
	}
}

const Players = game.GetService('Players');
const Workspace = game.GetService('Workspace');
const StarterPlayer = game.GetService('StarterPlayer');
const PhysicsService = game.GetService('PhysicsService');

const Client_RespawnRequest = Network.Server.Get('RequestRespawn');
const Client_CharacterUpdated = Network.Server.Get('CharacterStatusUpdated');

const Characters = new Map<number, CharController>();
const DefDescription = Players.GetHumanoidDescriptionFromUserId(3676469645);

// Get the game server size and create characters
for (let index = 0; index < Players.MaxPlayers + 5; index++) {
	const CharacterModel = Players.CreateHumanoidModelFromDescription(DefDescription, 'R6') as BaseCharacter;
	const HumanoidRootPart = CharacterModel.WaitForChild('HumanoidRootPart') as BasePart;
	const Humanoid = CharacterModel.WaitForChild('Humanoid') as Humanoid;
	Humanoid.AutoRotate = false;
	Humanoid.DisplayName = 'Player';
	Humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff;
	Humanoid.HealthDisplayDistance = 0;
	Humanoid.NameDisplayDistance = 0;
	Humanoid.NameOcclusion = Enum.NameOcclusion.OccludeAll;
	Humanoid.MaxHealth = 1;
	Humanoid.Health = Humanoid.MaxHealth;
	Humanoid.BreakJointsOnDeath = false;
	Humanoid.WalkSpeed = StarterPlayer.CharacterWalkSpeed;
	Humanoid.JumpPower = StarterPlayer.CharacterJumpPower;
	Humanoid.SetStateEnabled(Enum.HumanoidStateType.Physics, false);
	Humanoid.SetStateEnabled(Enum.HumanoidStateType.PlatformStanding, false);

	CharacterModel.Name = tostring(index);
	CharacterModel.Parent = Folders.GEntities.char_players;
	HumanoidRootPart.Anchored = true;
	HumanoidRootPart.CFrame = new CFrame(0, 10000, 0);
	HumanoidRootPart.Size = new Vector3(2, 2, 2);

	CharacterModel.GetChildren().forEach((inst) => {
		if (inst.IsA('Accessory') || inst.IsA('Hat')) {
			const Handle = inst.FindFirstChildWhichIsA('BasePart');
			if (!Handle) return;
			Handle.LocalTransparencyModifier = 1;
			Handle.CanCollide = false;
			Handle.CanQuery = false;
			Handle.CanTouch = false;
			return;
		}

		if (inst.IsA('BasePart')) {
			PhysicsService.SetPartCollisionGroup(inst, 'GBaseCharacters');
			if (inst.Name.match('Arm')[0] !== undefined) {
				inst.CanCollide = false;
				inst.CanQuery = false;
				inst.CanTouch = false;
			}
		}
	});

	// Create controller
	const Controller = new CharController(index, CharacterModel);
	Characters.set(index, Controller);
}

function FindAvaiableController() {
	let avaiable: CharController | undefined;
	Characters.forEach((info) => {
		if (avaiable) return;
		if (info.PlayerUserId === undefined) avaiable = info;
		task.wait(0.25);
	});
	return avaiable;
}

function ParentCharacter(userid: number) {
	let Controller: CharController | undefined;
	do Controller = FindAvaiableController();
	while (Controller === undefined);

	//const Description = Players.GetHumanoidDescriptionFromUserId(userid);
	//const Humanoid = Controller.Model.WaitForChild('Humanoid') as Humanoid;
	//Humanoid.ApplyDescription(Description);

	Controller.Model.GetChildren().forEach((inst) => {
		if (inst.IsA('Accessory') || inst.IsA('Hat')) {
			const Handle = inst.FindFirstChildWhichIsA('BasePart');
			if (!Handle) return;
			Handle.LocalTransparencyModifier = 1;
			Handle.CanCollide = false;
			Handle.CanQuery = false;
			Handle.CanTouch = false;
			return;
		}

		if (inst.IsA('BasePart')) {
			PhysicsService.SetPartCollisionGroup(inst, 'GBaseCharacters');
			if (inst.Name.match('Arm')[0] !== undefined || inst.Name.match('Hand')[0] !== undefined) {
				inst.CanCollide = false;
				inst.CanQuery = false;
				inst.CanTouch = false;
			}
		}
	});

	Controller.Reset();
	Controller.PlayerUserId = userid;
	return Controller;
}

function GetClientInterface(characterid: number) {
	const Controller = Characters.get(characterid)!;
	const client_interface: ClientCharacterInfo = {
		Model: Controller.Model,
		Info: {
			Health: Controller.Health,
			MaxHealth: Controller.MaxHealth,
			Position: Controller.Model.HumanoidRootPart.Position,
			Angle: new Vector2(Controller.Model.HumanoidRootPart.CFrame.ToOrientation()[1], 0),
		},
	};
	return client_interface;
}

Client_RespawnRequest.SetCallback((player) => {
	{
		let PlayerExistingCharacer: CharController | undefined;
		Characters.forEach((info) => {
			if (!PlayerExistingCharacer && info.PlayerUserId === player.UserId) PlayerExistingCharacer = info;
		});
		if (PlayerExistingCharacer) {
			if (!PlayerExistingCharacer.Alive) PlayerExistingCharacer.Reset();
			else return false;
		}
	}

	const CharacterInfo = ParentCharacter(player.UserId);
	const Character = CharacterInfo.Model;

	// Find a random spawn location
	const DefaultSpawnLocation = new CFrame(0, 10, 0);
	const Children = Folders.GMap.func_spawn.GetChildren();
	let SpawnLocation: BasePart | undefined;
	if (!Children.isEmpty()) {
		do SpawnLocation = Children[math.random(0, Children.size())] as BasePart;
		while (SpawnLocation !== undefined);
	}

	Character.Humanoid.ChangeState(Enum.HumanoidStateType.Jumping);
	Character.HumanoidRootPart.CFrame = (SpawnLocation !== undefined && SpawnLocation.CFrame) || DefaultSpawnLocation;
	Character.HumanoidRootPart.Anchored = false;
	Character.HumanoidRootPart.SetNetworkOwner(player);

	return GetClientInterface(CharacterInfo.ID);
});

Signals.CommandFired.Connect((player, userlvl, cmd, arg0) => {
	let player_character: CharController | undefined;
	Characters.forEach((controller) => {
		if (!controller.Alive || controller.PlayerUserId !== player.UserId) return;
		player_character = controller;
	});

	if (cmd === 'takedmg' && userlvl > 1 && player_character) {
		const damage = tonumber(arg0);
		if (damage === undefined) {
			warn('invalid damage, got', string, type(string));
			return;
		}

		player_character.TakeDamage(damage);
		return;
	}

	if (cmd === 'reset' && userlvl > 0 && player_character) {
		player_character.TakeDamage(player_character.Health);
		return;
	}
});

declare global {
	interface CharacterFromUserId {
		Model: BaseCharacter;
		PlayerUserId: number;
		CharacterId: number;
		Health: number;
		MaxHealth: number;
		Alive: boolean;
	}
}
Signals.GetCharacterFromUserId.OnInvoke = (userid: number) => {
	let reply: CharacterFromUserId | undefined;
	Characters.forEach((controller) => {
		if (reply || controller.PlayerUserId !== userid) return;
		reply = {
			Model: controller.Model,
			PlayerUserId: controller.PlayerUserId,
			CharacterId: controller.ID,
			Health: controller.Health,
			MaxHealth: controller.MaxHealth,
			Alive: controller.Alive,
		};
	});
	return reply;
};
