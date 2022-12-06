// Author: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import GenerateString from 'shared/modules/randomstring';
import Signals from 'client/providers/signals';
import Network from 'shared/network';
import Values from 'client/providers/values';

class Component implements BaseClientComponent {
	DefDescription = Services.Players.GetHumanoidDescriptionFromUserId(3676469645);
	CreateHumanoidModelFromDescription(Description = this.DefDescription): Model {
		const CharacterModel = Services.Players.CreateHumanoidModelFromDescription(Description, 'R6');
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
		CharacterModel.Parent = Folders.Workspace.Objects;
		HumanoidRootPart.Anchored = true;
		HumanoidRootPart.CFrame = new CFrame(0, 10000, 0);

		CharacterModel.GetChildren().forEach(inst => {
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

	Network = {
		RespawnRequest: Network.PlrEntity_RequestRespawn,
		InfoUpdated: Network.PlrEntity_LocalInfoChanged,
	};

	constructor() {
		Signals.Character_SendRespawnRequest.Handle = () => {
			const info = this.Network.RespawnRequest.InvokeServer().awaitStatus()[1] as PlayerEntityInfo | undefined;
			if (!info) return false;

			Values.Character.Health = info.Health;
			Values.Character.MaxHealth = info.MaxHealth;
			Values.Character.CollisionBox = info.Model;
			Values.Character.Id = info.Id;
			return true;
		};

		this.Network.InfoUpdated.OnClientPost = info => {
			if (info.Health !== Values.Character.Health) {
				if (info.Health === 0) {
					Signals.CharacterDied.Fire();
					return;
				}

				const StoredHealth = Values.Character.Health;
				const NewHealth = info.Health;
				StoredHealth > NewHealth ? Signals.CharacterTookDamage.Fire() : Signals.CharacterHealed.Fire();
				Values.Character.Health = NewHealth;
				Values.Character.MaxHealth = info.MaxHealth;
			}
		};
	}
	Start(): void {}
	FixedUpdate(): void {}
	Update(delta_time: number): void {}
}

export function Init() {
	return new Component();
}

export const InitOrder = -5;
