// Creator: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import Values from 'client/providers/values';
import { ConVar, GetCVar } from 'shared/components/vars';
import { GetFolderInfo } from 'shared/network';

// cvars
const client_fov = new ConVar('fov', 80, "Change player's FOV");
const menu_fov = new ConVar('fov_menu', 70, '', ['Readonly']);
const camera_mode = new ConVar('cam_mode', 0, '', ['Hidden']);

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;

	Camera = Services.Workspace.CurrentCamera!;
	CameraVerticalClamp = math.rad(90);
	CameraRotation = new Vector2();

	RecoilTweening = false;
	Recoil = new Instance('Vector3Value');
	TargetRecoil = new Vector3();
	RecoverTime = 0.25;

	LastCameraMode = 0;

	constructor() {}
	Start(): void {}
	FixedUpdate(): void {}

	Update(delta_time: number): void {
		const current_cam_mode = camera_mode;
		if (this.LastCameraMode !== current_cam_mode.value) {
			this.LastCameraMode = current_cam_mode.value;
			this.CameraRotation = new Vector2();
		}

		if (current_cam_mode.value === 1) {
			if (Values.Character === undefined || !Values.camUnlock.isEmpty()) {
				Services.UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
				return;
			}

			Services.UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;
			this.Gameplay_Cam(delta_time);
			return;
		}

		if (current_cam_mode.value === 0) {
			Services.UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
			this.MainMenu_Cam();
			return;
		}
	}

	Gameplay_Cam(dt: number) {
		this.Camera.CameraType = Enum.CameraType.Scriptable;
		this.Camera.FieldOfView = client_fov.value;

		if (!Values.Character) return;

		const Thumbstick2 = GetCVar('joy_thumbstick2') as ConVar<Vector3>;
		const delta = new Vector2(Thumbstick2.value.X, Thumbstick2.value.Y).add(
			Services.UserInputService.GetMouseDelta(),
		);

		const rotation_x = this.CameraRotation.X - math.rad(delta.X);
		const rotation_y = math.min(
			math.max(this.CameraRotation.Y - math.rad(delta.Y), -this.CameraVerticalClamp),
			this.CameraVerticalClamp,
		);
		this.CameraRotation = new Vector2(rotation_x, rotation_y);

		if (!this.RecoilTweening) {
			this.Recoil.Value = this.Recoil.Value.Lerp(new Vector3(), this.RecoverTime * (dt * 60));
			this.TargetRecoil = this.Recoil.Value;
		}

		const CameraLookCF = CFrame.Angles(0, this.CameraRotation.X, 0).mul(CFrame.Angles(this.CameraRotation.Y, 0, 0));
		const FinalCFrame = new CFrame(Values.Character.Model.Base.CameraAttachment.WorldPosition).mul(CameraLookCF);

		this.Camera.CFrame = FinalCFrame.mul(CFrame.Angles(this.Recoil.Value.Y, 0, 0))
			.mul(CFrame.Angles(0, this.Recoil.Value.X, 0))
			.mul(CFrame.Angles(0, 0, this.Recoil.Value.Z));

		Values.camCFrame = FinalCFrame;
	}

	MainMenu_Cam() {
		this.Camera.CameraType = Enum.CameraType.Scriptable;
		this.Camera.FieldOfView = menu_fov.value;

		const base_part = Folders.Workspace.Map.func_entity.FindFirstChild('Camera_Menu') as BasePart | undefined;
		if (base_part) this.Camera.CFrame = this.Camera.CFrame.Lerp(base_part.CFrame, 0.05);
	}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
