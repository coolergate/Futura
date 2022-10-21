task.wait(1);

import RenderPriorities from './components/render';
import console_cmds from './providers/cmds';
import Folders from 'shared/folders';
import Values from './providers/values';
import Signals from './providers/signals';

Signals.Start.Wait();

const Player = game.GetService('Players').LocalPlayer;
const RunService = game.GetService('RunService');
const UserInputService = game.GetService('UserInputService');

const Camera = game.GetService('Workspace').CurrentCamera;
const CameraVerticalClamp = math.rad(90);
let CameraRotation = new Vector2();
let CameraLastRotation = new Vector2();

const Recoil = new Instance('Vector3Value');
let TargetRecoil = new Vector3();
const TweeningRecoil = false;
const RecoverTime = 0.25;

RunService.BindToRenderStep('CCameraInput', RenderPriorities.CameraInput, () => {
	if (Values.CCurrentCharacter === undefined || !Values.CCameraEnable || !Values.CCameraUnlock.isEmpty())
		UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
	else UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;

	const delta = UserInputService.GetMouseDelta();

	CameraLastRotation = CameraRotation;
	const rotation_x = CameraRotation.X - math.rad(delta.X);
	const rotation_y = math.min(
		math.max(CameraRotation.Y - math.rad(delta.Y), -CameraVerticalClamp),
		CameraVerticalClamp,
	);
	CameraRotation = new Vector2(rotation_x, rotation_y);
});

RunService.BindToRenderStep('CCameraRender', RenderPriorities.CameraRender, (dt) => {
	Camera!.CameraType = Enum.CameraType.Scriptable;
	if (Values.CCurrentCharacter === undefined) return;
	const Character = Values.CCurrentCharacter;
	const CharacterHead = Character.Head;

	if (!TweeningRecoil) {
		Recoil.Value = Recoil.Value.Lerp(new Vector3(), RecoverTime * (dt * 60));
		TargetRecoil = Recoil.Value;
	}

	const CharacterMovement = Values.CCharacterMovement;
	const CameraLookCF = CFrame.Angles(0, CameraRotation.X, 0).mul(CFrame.Angles(CameraRotation.Y, 0, 0));

	const Dir = CameraLookCF.LookVector.mul(new Vector3(1, 0, 1)).Dot(CharacterMovement);

	const FinalCFrame = new CFrame(CharacterHead.Position).mul(CameraLookCF).mul(CFrame.Angles(0, 0, math.rad(Dir)));

	if (Values.CCameraEnable) {
		if (Values.CCameraLockTo !== undefined) Camera!.CFrame = Values.CCameraLockTo.CFrame;
		else
			Camera!.CFrame = FinalCFrame.mul(CFrame.Angles(Recoil.Value.Y, 0, 0))
				.mul(CFrame.Angles(0, Recoil.Value.X, 0))
				.mul(CFrame.Angles(0, 0, Recoil.Value.Z));
	}
	Camera!.FieldOfView = console_cmds.get('cg_fov') as number;
	Values.CCameraCFrame = FinalCFrame;
});
