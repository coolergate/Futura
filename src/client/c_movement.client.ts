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
let NextFrameSkipJump = false;

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

const overlap_params = new OverlapParams();
overlap_params.FilterDescendantsInstances = [Folders.World.Map.Props, Folders.World.Map.Parts];
overlap_params.FilterType = Enum.RaycastFilterType.Whitelist;

function number_lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

function CollisionBoxFloorCheck(): boolean {
	const CollisionBox = Values.Character.CollisionBox;
	if (!CollisionBox) return false;

	return (
		Workspace.GetPartBoundsInBox(
			new CFrame(CollisionBox.CFrame.Position.sub(new Vector3(0, 2.5, 0))),
			new Vector3(1.5, 0.5, 1.5),
			overlap_params,
		).isEmpty() === false
	);
}

RunService.Heartbeat.Connect(() => {
	if (Values.Character.CollisionBox)
		Values.Character.CollisionBox.CFrame = new CFrame(Values.Character.CollisionBox.CFrame.Position);
});

RunService.BindToRenderStep('CMovement_Move', RenderPriorities.CharacterMovement, (dt) => {
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

	FrameTime += dt;
	if (FrameTime < 1 / 60) return;
	FrameTime = 0;

	Grounded = CollisionBoxFloorCheck();

	let wish_velocity = 0;
	const vel = math.round(CollisionBox.AssemblyLinearVelocity.mul(new Vector3(1, 0, 1)).Magnitude);

	if (Grounded) {
		if (Jumping) {
			if (!NextFrameSkipJump) {
				Jumping = false;
				CollisionBox.AssemblyLinearVelocity = CollisionBox.AssemblyLinearVelocity.mul(new Vector3(1, 0, 1));
			} else NextFrameSkipJump = false;
		} else {
			if (InputRequest) {
				wish_velocity = StarterPlayer.CharacterWalkSpeed;
				LastWrldDir = WorldDirection;
			}

			if (vel <= wish_velocity) CollisionBox.ApplyImpulse(WorldDirection.mul(wish_velocity).mul(1.5));

			if (vel > wish_velocity + 3) {
				const discount = wish_velocity - vel;
				const current_dir = CollisionBox.AssemblyLinearVelocity;
				CollisionBox.ApplyImpulse(current_dir.Unit.mul(discount).mul(2));
			}
		}
	}

	if (JumpKeybind.Active && Grounded && !Jumping) {
		Jumping = true;
		NextFrameSkipJump = true;
		CollisionBox.ApplyImpulse(new Vector3(0, 200, 0));
	}
});
