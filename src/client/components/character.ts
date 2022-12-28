// Author: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import GenerateString from 'shared/randomstring';
import Signals from 'client/providers/signals';
import Network from 'shared/network';
import Values from 'client/providers/values';
import { CVar, GetCVar } from 'shared/vars';

function CreateHumanoidModelFromDescription(Description: HumanoidDescription): Model {
	const CharacterModel = Services.Players.CreateHumanoidModelFromDescription(Description, 'R6');
	const HumanoidRootPart = CharacterModel.WaitForChild('HumanoidRootPart') as BasePart;
	const hum = CharacterModel.WaitForChild('Humanoid') as Humanoid;
	hum.AutoRotate = false;
	hum.DisplayName = '';
	hum.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff;
	hum.HealthDisplayDistance = 0;
	hum.NameDisplayDistance = 0;
	hum.NameOcclusion = Enum.NameOcclusion.OccludeAll;
	hum.MaxHealth = 1;
	hum.Health = hum.MaxHealth;
	hum.BreakJointsOnDeath = false;
	hum.WalkSpeed = 0;
	hum.JumpPower = 0;

	CharacterModel.Name = GenerateString();
	CharacterModel.Parent = Folders.Objects;
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

class Component implements BaseClientComponent {
	constructor() {
		Network.entities.ent_Character.info_changed.OnClientPost = NewInfo => {
			// TODO Handle info from other characters

			const PreviousInfo = Values.Character;

			// if the server is just reminding us that we have no character
			if (NewInfo === undefined) {
				if (PreviousInfo !== undefined) GetCVar('cam_mode')!.value = 0;
				return;
			}

			// when we spawn in
			if (PreviousInfo === undefined) {
				Values.Character = NewInfo;
				Signals.Character.Spawned.Fire(NewInfo);
				GetCVar('cam_mode')!.value = 1;
				return;
			}

			// health changes
			if (NewInfo.Health !== PreviousInfo.Health) {
				if (NewInfo.Health === 0) {
					Signals.Character.Died.Fire(NewInfo);
					GetCVar('cam_mode')!.value = 0;
					return;
				}

				const CurrentHealth = PreviousInfo.Health;
				const NewHealth = NewInfo.Health;
				CurrentHealth > NewHealth
					? Signals.Character.TookDamage.Fire(CurrentHealth, NewHealth)
					: Signals.Character.Healed.Fire(CurrentHealth, NewHealth);
				Signals.Character.HealthChanged.Fire(CurrentHealth, NewHealth);
			}

			Values.Character = NewInfo;
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
