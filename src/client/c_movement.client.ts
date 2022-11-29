//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose:

task.wait(1);

import RenderPriorities from './modules/render';
import Signals from './providers/signals';
import Values from './providers/values';
import { ConVar, CreatedVars, GetCVar } from 'shared/components/vars';
import { Input } from './modules/input';

const UserInputService = game.GetService('UserInputService');
const StarterPlayer = game.GetService('StarterPlayer');
const RunService = game.GetService('RunService');
const Workspace = game.GetService('Workspace');

let LastWrldDir = new Vector3();
let FrameTime = 0;
let Grounded = false;
let Jumping = false;
let NextFrameSkipJump = false;

//=============================================================================
// ConVars
//=============================================================================
const cmov_duck_method = new ConVar('cmov_duck_method', 0, ''); // 0 is hold, 1 is toggle, 2 is analogic (gamepad only)

//=============================================================================
// Input directions
//=============================================================================
const Directions = new Map<Input, Enum.NormalId>([
	[new Input('move_forward'), Enum.NormalId.Front],
	[new Input('move_back'), Enum.NormalId.Back],
	[new Input('move_left'), Enum.NormalId.Left],
	[new Input('move_right'), Enum.NormalId.Right],
]);
const JumpKeybind = new Input('jump');

Signals.Start.Wait();

function number_lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

RunService.Heartbeat.Connect(() => {
	if (Values.Character.CollisionBox)
		Values.Character.CollisionBox.CFrame = new CFrame(Values.Character.CollisionBox.CFrame.Position);
});

let LastVel = 0;

RunService.BindToRenderStep('CMovement_Move', RenderPriorities.CharacterMovement, (dt) => {
	if (!Values.Character.CollisionBox) return;

	const CollisionBox = Values.Character.CollisionBox;

	// Wish direction
	const Thumbstick1 = GetCVar('joy_thumbstick1') as ConVar<Vector3>;
	let WishDir = new Vector3(Thumbstick1.value.X, 0, -Thumbstick1.value.Y);
	Directions.forEach((value, input) => {
		if (!input.Active) return;
		WishDir = WishDir.add(Vector3.FromNormalId(value));
	});
	if (WishDir.Magnitude > 0) WishDir = WishDir.Unit.mul(new Vector3(1, 0, 1));

	const [, CY] = Workspace.CurrentCamera!.CFrame.ToOrientation();
	const CameraWorldDirection = new CFrame().mul(CFrame.Angles(0, CY, 0));

	let WorldDirection = CameraWorldDirection.VectorToWorldSpace(WishDir);
	if (WorldDirection.Magnitude > 0) WorldDirection = WorldDirection.Unit.mul(new Vector3(1, 0, 1));

	FrameTime += dt;
	if (FrameTime < 1 / 60) return;
	FrameTime = 0;

	Grounded = CollisionBox.AssemblyLinearVelocity.Y * math.sign(CollisionBox.AssemblyLinearVelocity.Y) <= 2; //CollisionBoxFloorCheck();

	let wish_velocity = 0;
	const vel = math.round(CollisionBox.AssemblyLinearVelocity.mul(new Vector3(1, 0, 1)).Magnitude);
	if (Grounded) {
		if (Jumping) {
			if (!NextFrameSkipJump) {
				Jumping = false;
				CollisionBox.AssemblyLinearVelocity = CollisionBox.AssemblyLinearVelocity.mul(new Vector3(1, 0, 1));
			} else NextFrameSkipJump = false;
		} else {
			if (WishDir.Magnitude > 0) {
				wish_velocity = StarterPlayer.CharacterWalkSpeed;
				LastWrldDir = WorldDirection;
			}

			CollisionBox.Force.LineDirection = WorldDirection;
			CollisionBox.Force.LineVelocity = wish_velocity;
		}
	}

	if (vel !== LastVel) {
		print(vel);
		LastVel = vel;
	}

	if (JumpKeybind.Active && Grounded && !Jumping) {
		Jumping = true;
		NextFrameSkipJump = true;
		CollisionBox.ApplyImpulse(new Vector3(0, 200, 0));
	}
});