// Creator: coolergate#2031
// Purpose: Control world camera

import RenderPriorities from './modules/render';
import Values from './providers/values';
import Signals from './providers/signals';
import { ConVar, GetCVar } from 'shared/components/vars';

Signals.Start.Wait();

const Player = game.GetService('Players').LocalPlayer;
const RunService = game.GetService('RunService');
const UserInputService = game.GetService('UserInputService');

const Camera = game.GetService('Workspace').CurrentCamera!;
const CameraVerticalClamp = math.rad(90);
let CameraRotation = new Vector2();
let CameraLastRotation = new Vector2();

const Recoil = new Instance('Vector3Value');
let TargetRecoil = new Vector3();
const TweeningRecoil = false;
const RecoverTime = 0.25;

const client_fov = new ConVar('fov', 80, "Change player's FOV");
const menu_fov = new ConVar('fov_menu', 70, '', ['Readonly']);
const camera_mode = new ConVar('cam_mode', 1, '', ['Hidden']);

RunService.BindToRenderStep('CCameraInput', RenderPriorities.CameraInput, () => {
	Camera.FieldOfView = client_fov.value as number;

	if (Values.Character.CollisionBox === undefined || !Values.CCameraEnable || !Values.CCameraUnlock.isEmpty())
		UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
	else UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;

	const Thumbstick2 = GetCVar('joy_thumbstick2') as ConVar<Vector3>;
	const delta = new Vector2(Thumbstick2.value.X, Thumbstick2.value.Y).add(UserInputService.GetMouseDelta());

	CameraLastRotation = CameraRotation;
	const rotation_x = CameraRotation.X - math.rad(delta.X);
	const rotation_y = math.min(
		math.max(CameraRotation.Y - math.rad(delta.Y), -CameraVerticalClamp),
		CameraVerticalClamp,
	);
	CameraRotation = new Vector2(rotation_x, rotation_y);
});

RunService.BindToRenderStep('CCameraRender', RenderPriorities.CameraRender, dt => {
	Camera!.CameraType = Enum.CameraType.Scriptable;
	if (Values.Character.CollisionBox === undefined) return;

	if (!TweeningRecoil) {
		Recoil.Value = Recoil.Value.Lerp(new Vector3(), RecoverTime * (dt * 60));
		TargetRecoil = Recoil.Value;
	}

	const CameraLookCF = CFrame.Angles(0, CameraRotation.X, 0).mul(CFrame.Angles(CameraRotation.Y, 0, 0));
	const FinalCFrame = new CFrame(Values.Character.CollisionBox.HumanoidRootPart.CameraAttachment.WorldPosition).mul(
		CameraLookCF,
	);

	if (Values.CCameraEnable) {
		if (Values.CCameraLockTo !== undefined) Camera!.CFrame = Values.CCameraLockTo.CFrame;
		else {
			Camera!.CFrame = FinalCFrame.mul(CFrame.Angles(Recoil.Value.Y, 0, 0))
				.mul(CFrame.Angles(0, Recoil.Value.X, 0))
				.mul(CFrame.Angles(0, 0, Recoil.Value.Z));
			const [x, y, z] = Camera!.CFrame.ToOrientation();
		}
	}
	Values.CCameraCFrame = FinalCFrame;
});
