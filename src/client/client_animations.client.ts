import Folders from 'shared/folders';
import Signals from './providers/signals';
import Values from './providers/values';

Signals.Start.Wait();

const PhysicsService = game.GetService('PhysicsService');
const StarterPlayer = game.GetService('StarterPlayer');
const RunService = game.GetService('RunService');

Folders.GEntities.char_players.GetChildren().forEach((inst) => {
	const Humanoid = inst.WaitForChild('Humanoid') as Humanoid;
	const Animator = Humanoid.WaitForChild('Animator') as Animator;
	const HumanoidRootPart = inst.WaitForChild('HumanoidRootPart') as BasePart;

	// Load animations
	const AnimationList = new Map<string, AnimationTrack>();
	const Animations = Folders.GAnimations;
	Animations.GetChildren().forEach((anim) => {
		if (!anim.IsA('Animation')) return;
		AnimationList.set(anim.Name, Animator.LoadAnimation(anim));
	});

	// Playing animations
	const WalkAnimation = AnimationList.get('CharacterWalk');
	RunService.RenderStepped.Connect(() => {
		const Direction = HumanoidRootPart.AssemblyLinearVelocity;
		if (!WalkAnimation || Values.Character.Model === inst) return;
		if (Direction.Magnitude > StarterPlayer.CharacterWalkSpeed - 5) {
			if (!WalkAnimation.IsPlaying) WalkAnimation.Play();
		} else {
			if (WalkAnimation.IsPlaying) WalkAnimation.Stop();
		}
	});
});
