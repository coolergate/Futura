task.wait(1);

import Network from 'shared/network';
import Signals from './providers/signals';
import Values from './providers/values';
import console_cmds from './providers/cmds';
import Log from '@rbxts/log';
import Folders from 'shared/folders';
import { Bin } from '@rbxts/bin';

Signals.Start.Wait();

const RunService = game.GetService('RunService');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const PhysicsService = game.GetService('PhysicsService');

const Server_RespawnRequest = Network.Client.Get('RequestRespawn');
const Server_CharUpdated = Network.Client.Get('CharacterStatusUpdated');

Signals.CharacterRequestRespawn.OnInvoke = function () {
	const CharacterInfo = Server_RespawnRequest.CallServer();
	if (!CharacterInfo) return;

	const Character = CharacterInfo.Model;
	const Humanoid = CharacterInfo.Model.WaitForChild('Humanoid') as Humanoid;

	Values.Character.Health = CharacterInfo.Info.Health;
	Values.Character.MaxHealth = CharacterInfo.Info.MaxHealth;
	Values.Character.Model = Character;
	Values.CCurrentCharacter = Character;

	Character.GetChildren().forEach((instance) => {
		if (instance.IsA('BasePart')) {
			instance.LocalTransparencyModifier = 1;
		}
	});
};

Server_CharUpdated.Connect((CharacterInfo) => {
	// Check health
	if (CharacterInfo.Info.Health !== Values.Character.Health) {
		if (CharacterInfo.Info.Health === 0) {
			Signals.CharacterDied.Fire();

			CharacterInfo.Model.GetChildren().forEach((instance) => {
				if (instance.IsA('BasePart')) {
					instance.LocalTransparencyModifier = 1;
				}
			});

			return;
		}

		const StoredHealth = Values.Character.Health;
		const NewHealth = CharacterInfo.Info.Health;
		if (StoredHealth > NewHealth) Signals.CharacterTookDamage.Fire();
		else Signals.CharacterHealed.Fire();
		Values.Character.Health = NewHealth;
		Values.Character.MaxHealth = CharacterInfo.Info.MaxHealth;
	}
});

// Setup characters
Folders.GEntities.char_players.GetChildren().forEach((inst) => {
	const Humanoid = inst.WaitForChild('Humanoid') as Humanoid;
	const Animator = Humanoid.WaitForChild('Animator') as Animator;
	const HumanoidRootPart = inst.WaitForChild('HumanoidRootPart') as BasePart;

	inst.GetChildren().forEach((descendant) => {
		if (descendant.IsA('Accessory') || descendant.IsA('Hat')) {
			const Handle = descendant.FindFirstChildWhichIsA('BasePart');
			if (!Handle) return;
			Handle.LocalTransparencyModifier = 1;
			Handle.CanCollide = false;
			Handle.CanQuery = false;
			Handle.CanTouch = false;
			return;
		}

		if (descendant.IsA('BasePart')) {
			PhysicsService.SetPartCollisionGroup(descendant, 'GBaseCharacters');
		}
	});

	// Load animations
	const AnimationList = new Map<string, AnimationTrack>();
	const Animations = Folders.GAnimations;
	Animations.GetChildren().forEach((anim) => {
		if (!anim.IsA('Animation')) return;
		AnimationList.set(anim.Name, Animator.LoadAnimation(anim));
	});

	// Create new Bin
	const CharacterBin = new Bin();

	// Playing animations
	const WalkAnimation = AnimationList.get('CharacterWalk');
	CharacterBin.add(
		RunService.RenderStepped.Connect(() => {
			const Direction = Humanoid.MoveDirection;
			if (!WalkAnimation) {
				warn('Run animation doesnt exist');
				return;
			}
			if (Direction.Magnitude > 0) {
				if (!WalkAnimation.IsPlaying) WalkAnimation.Play();
			} else {
				if (WalkAnimation.IsPlaying) WalkAnimation.Stop();
			}
		}),
	);

	inst.Destroying.Connect(() => CharacterBin.destroy());
});
