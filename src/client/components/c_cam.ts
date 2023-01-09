// Creator: coolergate#2031
// Purpose:

import * as Folders from 'shared/folders';
import Values from 'client/providers/values';
import { CVar, GetCVar } from 'shared/vars';
import { GetFolderInfo } from 'shared/network';
import { Thumbstick2 } from 'client/providers/input';

const UserInputService = game.GetService('UserInputService');

// cvars
const client_fov = new CVar('fov', 80, "Change player's FOV");
const menu_fov = new CVar('fov_menu', 70, '', ['Readonly']);

declare global {
	type C_CameraMode = 'Gameplay' | 'Menu' | 'Custom';
}

class Component implements BaseClientComponent {
	Player = game.GetService('Players').LocalPlayer;

	Camera = game.GetService('Workspace').CurrentCamera!;
	CameraVerticalClamp = math.rad(90);
	CameraRotation = new Vector2();

	RecoilTweening = false;
	Recoil = new Instance('Vector3Value');
	TargetRecoil = new Vector3();
	RecoverTime = 0.25;

	constructor() {}
	Start(): void {}
	FixedUpdate(): void {}

	Update(delta_time: number): void {
		// gameplay camera
		if (Values.CameraMode === 'Gameplay') {
			Values.Character === undefined || Values.Camera_Unlock.isEmpty()
				? (UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter)
				: (UserInputService.MouseBehavior = Enum.MouseBehavior.Default);
			this.Gameplay_Cam(delta_time);
			return;
		}

		// main menu camera
		if (Values.CameraMode === 'Menu') {
			UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
			this.CameraRotation = Vector2.zero;
			this.MainMenu_Cam();
			return;
		}
	}

	Gameplay_Cam(dt: number) {
		this.Camera.CameraType = Enum.CameraType.Scriptable;
		this.Camera.FieldOfView = client_fov.value;

		if (Values.Character === undefined) return;

		const delta = new Vector2(Thumbstick2.X, Thumbstick2.Y).add(UserInputService.GetMouseDelta());

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
		const FinalCFrame = new CFrame(Values.Character.CollisionBox.CameraAttachment.WorldPosition).mul(CameraLookCF);

		this.Camera.CFrame = FinalCFrame.mul(CFrame.Angles(this.Recoil.Value.Y, 0, 0))
			.mul(CFrame.Angles(0, this.Recoil.Value.X, 0))
			.mul(CFrame.Angles(0, 0, this.Recoil.Value.Z));

		Values.Camera_CFrame = FinalCFrame;
	}

	MainMenu_Cam() {
		this.Camera.CameraType = Enum.CameraType.Scriptable;
		this.Camera.FieldOfView = menu_fov.value;

		const base_part = Folders.Map.func_entity.FindFirstChild('Camera_Menu') as BasePart | undefined;
		this.Camera.CFrame = base_part ? base_part.CFrame : new CFrame();
	}
}

export function Init() {
	return new Component();
}
