task.wait(1);

import Signals from './providers/signals';
import Values from './providers/values';
import { Folders } from 'shared/global_resources';
import RenderPriorities from './modules/render';
import GenerateString from 'shared/modules/randomstring';
import Network from 'shared/network';

Signals.Start.Wait();

const Players = game.GetService('Players');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const PhysicsService = game.GetService('PhysicsService');
const StarterPlayer = game.GetService('StarterPlayer');
const StarterGui = game.GetService('StarterGui');
const RunService = game.GetService('RunService');
const Workspace = game.GetService('Workspace');

const Server_RespawnRequest = Network.Ent_Character_RequestRespawn;
const Server_EntityUpdated = Network.Ent_Character_InfoChanged;
const Server_EntitySpawned = Network.Ent_Character_Spawned;
const Server_RetrieveExistingEntities = Network.Ent_Character_GetAll;

const Client_RespawnRequest = Signals.Character_SendRespawnRequest;

const CharactersModelFolder = new Instance('Folder', Folders.Client.Objects);
CharactersModelFolder.Name = 'CharacterModels';
const PlrCollisionBoxEntities = Folders.World.Entities.WaitForChild('PlayersCollisionModels') as Folder;

const PlayersEntityList = new Map<string, PlayerEntityInfo_2>();

// Create characters based on server size //
const DefDescription = Players.GetHumanoidDescriptionFromUserId(3676469645);
function CreateHumanoidModelFromDescription(Description = DefDescription) {
	const CharacterModel = Players.CreateHumanoidModelFromDescription(Description, 'R6');
	const HumanoidRootPart = CharacterModel.WaitForChild('HumanoidRootPart') as BasePart;
	const Humanoid = CharacterModel.WaitForChild('Humanoid') as Humanoid;
	Humanoid.AutoRotate = false;
	Humanoid.DisplayName = '';
	Humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff;
	Humanoid.HealthDisplayDistance = 0;
	Humanoid.NameDisplayDistance = 0;
	Humanoid.NameOcclusion = Enum.NameOcclusion.OccludeAll;
	Humanoid.MaxHealth = 1;
	Humanoid.Health = Humanoid.MaxHealth;
	Humanoid.BreakJointsOnDeath = false;
	Humanoid.WalkSpeed = 0;
	Humanoid.JumpPower = 0;

	CharacterModel.Name = GenerateString();
	CharacterModel.Parent = Folders.Client.Entities;
	HumanoidRootPart.Anchored = true;
	HumanoidRootPart.CFrame = new CFrame(0, 10000, 0);

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
			inst.CanCollide = false;
			inst.CanQuery = false;
			inst.CanTouch = false;
		}
	});

	return CharacterModel;
}

Signals.Character_SendRespawnRequest.Handle = function () {
	const info = Server_RespawnRequest.InvokeServer().await()[1] as PlayerEntityInfo_1 | undefined;
	if (!info) return false;

	Values.Character.Health = info.Health;
	Values.Character.MaxHealth = info.MaxHealth;
	Values.Character.CollisionBox = info.CollisionBox;
	Values.Character.Id = info.Id;
	return true;
};

Server_EntityUpdated.OnClientPost = (Info) => {
	// Check health
	if (Info.Health !== Values.Character.Health) {
		if (Info.Health === 0) {
			Signals.CharacterDied.Fire();
			return;
		}

		const StoredHealth = Values.Character.Health;
		const NewHealth = Info.Health;
		if (StoredHealth > NewHealth) Signals.CharacterTookDamage.Fire();
		else Signals.CharacterHealed.Fire();
		Values.Character.Health = NewHealth;
		Values.Character.MaxHealth = Info.MaxHealth;
	}
};

const reset_bindableEvent = new Instance('BindableEvent');
reset_bindableEvent.Event.Connect(() => {
	Signals.SendConsoleCommand.Fire('/reset');
});
StarterGui.SetCore('ResetButtonCallback', reset_bindableEvent);