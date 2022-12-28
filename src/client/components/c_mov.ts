// Creator: coolergate#2031
// Purpose: Handle client-side movement

import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import * as Input from '../providers/input';
import Values from 'client/providers/values';
import { CVar, GetCVar } from 'shared/vars';

// cvar
const cvar_grounded = new CVar('cmov_p_grounded', false, '', ['Hidden']);
const cvar_duckmethod = new CVar('option_duck_method', 1, ''); // 0 = HOLD to duck, 1 = TOGGLE

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;

	Input = {
		Directions: new Map<Input.KeycodeEvent, Enum.NormalId>([
			[Input.KeycodeEvents.move_forward, Enum.NormalId.Front],
			[Input.KeycodeEvents.move_back, Enum.NormalId.Back],
			[Input.KeycodeEvents.move_left, Enum.NormalId.Left],
			[Input.KeycodeEvents.move_right, Enum.NormalId.Right],
		]),
		JumpKB: Input.KeycodeEvents.jump,
		CrouchKB: Input.KeycodeEvents.duck,
	};

	gc_params = new OverlapParams();

	constructor() {
		this.gc_params.FilterDescendantsInstances = [Folders.Map.obj_part];
		this.gc_params.MaxParts = 1;
		this.gc_params.FilterType = Enum.RaycastFilterType.Whitelist;
	}
	Start(): void {}
	FixedUpdate(): void {
		if (!Values.Character) return;
		const collisionbox = Values.Character.CollisionBox;

		const walkspeed = Services.StarterPlayer.CharacterWalkSpeed;
		const velocity = collisionbox.AssemblyLinearVelocity.mul(new Vector3(1, 0, 1));

		let ground_check = this.is_grounded();
		if (this.Input.JumpKB.Active && ground_check) {
			ground_check = false;
			collisionbox.AssemblyLinearVelocity = new Vector3(velocity.X, 20, velocity.Z);
		}

		const world_direction = this.GetCameraWorldDirection(this.GetInputDirection());
		collisionbox.AssemblyLinearVelocity =
			ground_check && velocity.Magnitude <= walkspeed + 5
				? collisionbox.AssemblyLinearVelocity.Lerp(world_direction.mul(walkspeed), 0.15)
				: collisionbox.AssemblyLinearVelocity;
	}
	Update(delta_time: number): void {
		if (!Values.Character) return;

		// keep it upright
		Values.Character.CollisionBox.CFrame = new CFrame(Values.Character.CollisionBox.CFrame.Position);
	}

	is_grounded(): boolean {
		if (!Values.Character) return false;

		const cbox_size = Values.Character.CollisionBox.Size;
		const cbox_cframe = Values.Character.CollisionBox.CFrame;

		const checkcframe = new CFrame(cbox_cframe.Position).sub(new Vector3(0, cbox_size.Y / 2, 0));
		const checksize = new Vector3(cbox_size.X - 0.125, 0.175, cbox_size.Z - 0.125);

		const cast = Services.Workspace.GetPartBoundsInBox(checkcframe, checksize, this.gc_params);
		return cast.size() > 0 ? true : false;
	}

	GetInputDirection(): Vector3 {
		let wish_dir = new Vector3(Input.Thumbstick1.X, 0, -Input.Thumbstick1.Y);

		this.Input.Directions.forEach((normal, input) => {
			if (!input.Active) return;
			wish_dir = wish_dir.add(Vector3.FromNormalId(normal));
		});
		if (wish_dir.Magnitude > 0) wish_dir = wish_dir.Unit;

		return wish_dir;
	}

	GetCameraWorldDirection(wish_dir: Vector3): Vector3 {
		const [, camera_y] = Services.Workspace.CurrentCamera!.CFrame.ToOrientation();
		const cam_worlddir = new CFrame().mul(CFrame.Angles(0, camera_y, 0));

		// world direction
		const world_direction = cam_worlddir.VectorToWorldSpace(wish_dir);
		return world_direction.Magnitude > 0 ? world_direction.Unit : Vector3.zero;
	}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
