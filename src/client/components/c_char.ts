// Author: coolergate#2031
// Purpose:

import * as Folders from 'shared/folders';
import GenerateString from 'shared/randomstring';
import Signals from 'client/providers/signals';
import Network from 'shared/network';
import Values from 'client/providers/values';
import { CVar, GetCVar } from 'shared/vars';

const Players = game.GetService('Players');
const PhysicsService = game.GetService('PhysicsService');

interface R6_Character extends Model {
	Humanoid: Humanoid;
	HumanoidRootPart: BasePart;
	['Left Arm']: BasePart;
	['Right Arm']: BasePart;
	['Left Leg']: BasePart;
	['Right Leg']: BasePart;
	Head: BasePart;
	Torso: BasePart;
	Shirt?: Shirt;
	ShirtGraphic?: ShirtGraphic;
	Pants?: Pants;
}

const DefaultDescription = new Instance('HumanoidDescription');
const DefaultCharacterModel = Players.CreateHumanoidModelFromDescription(DefaultDescription, 'R6') as R6_Character;
DefaultCharacterModel.Humanoid.AutoRotate = false;
DefaultCharacterModel.Humanoid.DisplayName = '';
DefaultCharacterModel.Humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff;
DefaultCharacterModel.Humanoid.HealthDisplayDistance = 0;
DefaultCharacterModel.Humanoid.NameDisplayDistance = 0;
DefaultCharacterModel.Humanoid.NameOcclusion = Enum.NameOcclusion.OccludeAll;
DefaultCharacterModel.Humanoid.MaxHealth = 1;
DefaultCharacterModel.Humanoid.Health = DefaultCharacterModel.Humanoid.MaxHealth;
DefaultCharacterModel.Humanoid.BreakJointsOnDeath = false;
DefaultCharacterModel.Humanoid.WalkSpeed = 0;
DefaultCharacterModel.Humanoid.JumpPower = 0;
DefaultCharacterModel.HumanoidRootPart.Anchored = true;
DefaultCharacterModel.HumanoidRootPart.Position = new Vector3(0, 10000, 0);
DefaultCharacterModel.Name = 'DefaultCharacter';
DefaultCharacterModel.Parent = Folders.CharacterModels;
DefaultCharacterModel.PrimaryPart = DefaultCharacterModel.HumanoidRootPart;
DefaultCharacterModel.GetChildren().forEach(inst => {
	if (inst.IsA('BasePart')) PhysicsService.SetPartCollisionGroup(inst, 'CharacterModel');
});

interface CharacterModelInfo {
	Model: R6_Character;
	Orientation: Vector3;
	TargetOrientation: Vector3;
	CollisionBox: CharacterCollision;
}

class Component implements BaseClientComponent {
	CreatedCharacterModels = new Array<CharacterModelInfo>();

	constructor() {
		Network.Entities.Character.LocalInfoChanged.OnClientPost = NewInfo => {
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

				const PreviousHealth = PreviousInfo.Health;
				const NewHealth = NewInfo.Health;
				PreviousHealth > NewHealth
					? Signals.Character.TookDamage.Fire(PreviousHealth, NewHealth)
					: Signals.Character.Healed.Fire(PreviousHealth, NewHealth);
				Signals.Character.HealthChanged.Fire(PreviousHealth, NewHealth);
			}

			Values.Character = NewInfo;
		};
	}

	Start(): void {
		coroutine.wrap(() => {
			while (game) {
				task.wait(0.25);
				this.UpdateCharacters();

				if (Values.Character !== undefined) {
					const [y, x] = Values.Camera_CFrame.ToOrientation();
					const Orientation = new Vector3(math.round(math.deg(x)), math.round(math.deg(y)), 0);
					Network.Entities.Character.LocalInfoUpdate.PostServer(
						Orientation,
						Values.Character.CollisionBox.Position,
					);
				}
			}
		})();
	}

	UpdateCharacters() {
		Network.Entities.Character.GetCurrentReplicated.InvokeServer()
			.await()
			.forEach(info => {
				let EquivalentInfo = this.CreatedCharacterModels.find(ModelInfo => {
					return ModelInfo.CollisionBox === info.CollisionBox;
				});
				if (!EquivalentInfo) {
					const clone = DefaultCharacterModel.Clone();
					clone.Parent = Folders.CharacterModels;
					EquivalentInfo = {
						Model: clone,
						Orientation: Vector3.zero,
						TargetOrientation: info.Orientation,
						CollisionBox: info.CollisionBox,
					};
					this.CreatedCharacterModels.insert(0, EquivalentInfo);
				}
				EquivalentInfo.TargetOrientation = info.Orientation;

				// hide our own character
				if (Values.Character?.CollisionBox === EquivalentInfo.CollisionBox)
					EquivalentInfo.Model.GetDescendants().forEach(inst => {
						if (!inst.IsA('BasePart')) return;
						inst.LocalTransparencyModifier = 1;
					});
				else
					EquivalentInfo.Model.GetDescendants().forEach(inst => {
						if (!inst.IsA('BasePart')) return;
						inst.LocalTransparencyModifier = 0;
					});
			});
	}

	update_time_passed = 0;
	Update(delta_time: number): void {
		this.CreatedCharacterModels.forEach(info => {
			const final_cframe = new CFrame(info.CollisionBox.Position).mul(
				CFrame.Angles(0, math.rad(info.Orientation.X), 0),
			);
			info.Model.PivotTo(final_cframe);
			info.Orientation = info.Orientation.Lerp(info.TargetOrientation, 0.25);
		});
	}
	FixedUpdate(dt: number): void {}
}

export function Init() {
	return new Component();
}

export const InitOrder = -5;
