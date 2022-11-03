//========= Copyright GGC Studios, All rights reserved. ============//
// Purpose: Movement for the client's assigned humanoid controller	//
//==================================================================//

task.wait(1);

import RenderPriorities from './components/render';
import console_cmds from './providers/cmds';
import Signals from './providers/signals';
import Values from './providers/values';
import Input from './components/input';
import Traceline from './components/traceline';
import { Folders } from 'shared/global_resources';

Signals.Start.Wait();

const RunService = game.GetService('RunService');
const Workspace = game.GetService('Workspace');
const StarterPlayer = game.GetService('StarterPlayer');

let LastWrldDir = new Vector3();
let FrameTime = 0;
let Grounded = false;
let Jumping = false;

const Directions = new Map<Input, Enum.NormalId>([
	[new Input('move_forward'), Enum.NormalId.Front],
	[new Input('move_back'), Enum.NormalId.Back],
	[new Input('move_left'), Enum.NormalId.Left],
	[new Input('move_right'), Enum.NormalId.Right],
]);
const JumpKeybind = new Input('jump');

const TracelineParams = new RaycastParams();
TracelineParams.FilterDescendantsInstances = [
	Folders.World.Filter,
	Folders.World.Map.Spawns,
	Folders.Server,
	Folders.Client,
];
TracelineParams.FilterType = Enum.RaycastFilterType.Blacklist;

function number_lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

let last_vel = 0; // temp
RunService.BindToRenderStep('CMovement_Move', RenderPriorities.CharacterMovement, (dt) => {
	// (coolergate) fps cap
	if (!Values.Character.CollisionBox) return;

	const CollisionBox = Values.Character.CollisionBox;
	let InputRequest = false;

	// TODO Controller input

	let WishDir = new Vector3();
	Directions.forEach((value, input) => {
		if (!input.Active) return;
		WishDir = WishDir.add(Vector3.FromNormalId(value));
		InputRequest = true;
	});
	if (WishDir.Magnitude > 0) WishDir = WishDir.Unit.mul(new Vector3(1, 0, 1));

	const [, CY] = Workspace.CurrentCamera!.CFrame.ToOrientation();
	const CameraWorldDirection = new CFrame().mul(CFrame.Angles(0, CY, 0));

	let WorldDirection = CameraWorldDirection.VectorToWorldSpace(WishDir);
	if (WorldDirection.Magnitude > 0) WorldDirection = WorldDirection.Unit.mul(new Vector3(1, 0, 1));

	CollisionBox.CFrame = new CFrame(CollisionBox.CFrame.Position);

	FrameTime += dt;
	if (FrameTime < 1 / 60) return;
	FrameTime = 0;

	Grounded =
		Workspace.Raycast(CollisionBox.CFrame.Position, new Vector3(0, -1, 0).mul(2.55), TracelineParams) !== undefined;

	let wish_velocity = 0;
	const vel = math.round(CollisionBox.AssemblyLinearVelocity.mul(new Vector3(1, 0, 1)).Magnitude);
	if (Grounded) {
		if (InputRequest) {
			wish_velocity = StarterPlayer.CharacterWalkSpeed;
			LastWrldDir = WorldDirection;
		}

		if (vel <= wish_velocity) CollisionBox.ApplyImpulse(WorldDirection.mul(wish_velocity).mul(3));

		if (vel > wish_velocity + 3) {
			const discount = wish_velocity - vel;
			const current_dir = CollisionBox.AssemblyLinearVelocity;
			CollisionBox.ApplyImpulse(current_dir.Unit.mul(discount).mul(4));
			print('discount force:', discount);
		}
	}

	if (vel !== last_vel) {
		print(vel, wish_velocity);
		last_vel = vel;
	}
	if (JumpKeybind.Active && Grounded && !Jumping) {
		Jumping = true;
		CollisionBox.ApplyImpulse(new Vector3(0, 500, 0));
		do RunService.RenderStepped.Wait();
		while (!Grounded);
		Jumping = false;
	}
});
