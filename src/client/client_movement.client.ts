task.wait(1);

import RenderPriorities from './components/render';
import console_cmds from './providers/cmds';
import Signals from './providers/signals';
import Values from './providers/values';
import Input from './components/input';
import Traceline from './components/traceline';
import Folders from 'shared/folders';

Signals.Start.Wait();

const RunService = game.GetService('RunService');
const Workspace = game.GetService('Workspace');

const MAccel = 0.175;

const Directions = new Map<Input, Enum.NormalId>([
	[new Input('move_forward'), Enum.NormalId.Front],
	[new Input('move_back'), Enum.NormalId.Back],
	[new Input('move_left'), Enum.NormalId.Left],
	[new Input('move_right'), Enum.NormalId.Right],
]);

const JumpKeybind = new Input('jump');

let MDirection = new Vector3();
let MGrounded = false;
let MJumping = false;

const TracelineParams = new RaycastParams();
TracelineParams.FilterDescendantsInstances = [Folders.GMap.env_solid];
TracelineParams.FilterType = Enum.RaycastFilterType.Whitelist;

let time_stamp = 0;
RunService.BindToRenderStep('CMovement_Move', RenderPriorities.CharacterMovement, (dt) => {
	if (!Values.CCurrentCharacter) return;
	const Humanoid = Values.CCurrentCharacter.Humanoid;
	const HumanoidRootPart = Values.CCurrentCharacter.HumanoidRootPart;

	let WishDir = new Vector3();
	Directions.forEach((value, input) => {
		if (!input.Active) return;
		WishDir = WishDir.add(Vector3.FromNormalId(value));
	});
	if (WishDir.Magnitude > 0) WishDir = WishDir.Unit.mul(new Vector3(1, 0, 1));

	const [X, Y, Z] = HumanoidRootPart.CFrame.ToOrientation();
	const LookCFrame = new CFrame(HumanoidRootPart.CFrame.Position).mul(CFrame.Angles(0, Y, 0));

	let WorldDirection = LookCFrame.VectorToWorldSpace(WishDir);
	if (WorldDirection.Magnitude > 0) WorldDirection = WorldDirection.Unit.mul(new Vector3(1, 0, 1));

	time_stamp += dt;
	if (time_stamp < 1 / 60) return;
	time_stamp = 0;

	MGrounded = Workspace.Raycast(HumanoidRootPart.Position, new Vector3(0, -4.1, 0), TracelineParams) !== undefined;

	if (MGrounded && !MJumping) MDirection = MDirection.Lerp(WorldDirection, MAccel);

	Humanoid.Move(MDirection, false);

	const v3_speed = HumanoidRootPart.AssemblyLinearVelocity;
	Values.CCharacterSpeed = v3_speed;

	if (JumpKeybind.Active && MGrounded && !MJumping) {
		MJumping = true;
		if (Humanoid.FloorMaterial.Name !== 'Air') Humanoid.ChangeState(Enum.HumanoidStateType.Jumping);
		do RunService.RenderStepped.Wait();
		while (!MGrounded);
		MJumping = false;
	}

	const CameraCFrame = Values.CCameraCFrame;
	const [, CY] = CameraCFrame.ToOrientation();
	HumanoidRootPart.CFrame = new CFrame(HumanoidRootPart.CFrame.Position).mul(CFrame.Angles(0, CY, 0));
});
