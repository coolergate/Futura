// Author: coolergate#2031
// Purpose:

import * as Folders from 'shared/folders';
import * as Util from 'shared/util';
import GenerateString from 'shared/randomstring';
import Signals from 'client/providers/signals';
import Network from 'shared/network';
import Values from 'client/providers/values';
import { CVar, GetCVar } from 'shared/vars';
import { KeycodeEvents } from 'client/providers/input';

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
	if (inst.IsA('BasePart')) {
		inst.CollisionGroup = 'CharacterModel';
		inst.CanCollide = false;
		inst.CanQuery = false;
	}
});

interface CharacterModelInfo {
	Model: R6_Character;
	Orientation: Vector2;
	TargetOrientation: Vector2;
	CollisionBox: CharacterCollision;
}

class Component implements BaseClientComponent {
	CreatedCharacterModels = new Array<CharacterModelInfo>();

	constructor() {
		Network.Entities.Character.LocalInfoChanged.OnClientPost = NewInfo => {
			const PreviousInfo = Values.Character;

			if (NewInfo === undefined) {
				if (PreviousInfo !== undefined) {
					Values.CameraMode = 'Menu';
					Signals.Character.Died.Fire();
					Values.Character = undefined;
				}
				return;
			}

			// when we spawn in
			if (PreviousInfo === undefined) {
				Values.Character = NewInfo;
				Signals.Character.Spawned.Fire();
				Values.CameraMode = 'Gameplay';
				return;
			}

			// health changes
			if (NewInfo.Health !== PreviousInfo.Health) {
				if (NewInfo.Health === 0) {
					Signals.Character.Died.Fire();
					Values.Character = undefined;
					Values.CameraMode = 'Menu';
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
				//task.wait(0.25);
				this.UpdateCharacters();
				this.NotifyServer();
			}
		})();
	}

	// Update server with the latest
	NotifyServer() {
		if (!Values.Character) return;

		const [y, x] = Values.Camera_CFrame.ToOrientation();
		const Angle = new Vector2(math.deg(x), math.deg(y));
		const Position = Values.Character.CollisionBox.CFrame.Position;
		Network.Entities.Character.LocalInfoUpdate.PostServer(Angle, Position);
	}

	UpdateCharacters() {
		Network.Entities.Character.GetCurrentReplicated.InvokeServer()
			.await()
			.forEach(info => {
				let ModelInfo = this.CreatedCharacterModels.find(ModelInfo => {
					return ModelInfo.CollisionBox === info.CollisionBox;
				});
				if (!ModelInfo) {
					const clone = DefaultCharacterModel.Clone();
					clone.Parent = Folders.CharacterModels;
					ModelInfo = {
						Model: clone,
						Orientation: Vector2.zero,
						TargetOrientation: info.Angle,
						CollisionBox: info.CollisionBox,
					};
					this.CreatedCharacterModels.insert(0, ModelInfo);
				}
				ModelInfo.TargetOrientation = info.Angle;

				// hide our own character
				if (Values.Character?.CollisionBox === ModelInfo.CollisionBox)
					ModelInfo.Model.GetDescendants().forEach(inst => {
						if (!inst.IsA('BasePart')) return;
						inst.LocalTransparencyModifier = 1;
					});
				else
					ModelInfo.Model.GetDescendants().forEach(inst => {
						if (!inst.IsA('BasePart')) return;
						inst.LocalTransparencyModifier = 0;
					});
			});
	}

	update_time_passed = 0;
	Update(delta_time: number): void {
		this.CreatedCharacterModels.forEach(info => {
			const final_cframe = new CFrame(info.CollisionBox.Position.add(new Vector3(0, 0.5, 0))).mul(
				CFrame.Angles(0, math.rad(info.Orientation.X), 0),
			);
			info.Model.PivotTo(final_cframe);
			//info.Orientation = info.Orientation.Lerp(info.TargetOrientation, 0.5);
			info.Orientation = info.TargetOrientation;
		});
	}
	FixedUpdate(dt: number): void {}
}

export function Init() {
	return new Component();
}
