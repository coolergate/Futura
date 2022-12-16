// Creator: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import Values from 'client/providers/values';
import { Input } from 'client/providers/input';
import { ConVar, GetCVar } from 'shared/components/vars';

// cvar
const cmov_p_grounded = new ConVar('cmov_p_grounded', 0, '', ['Hidden']);
const option_duck_method = new ConVar('option_duck_method', 1, ''); // 0 = HOLD to duck, 1 = TOGGLE

// movement
const Directions = new Map<Input, Enum.NormalId>([
	[new Input('move_forward'), Enum.NormalId.Front],
	[new Input('move_back'), Enum.NormalId.Back],
	[new Input('move_left'), Enum.NormalId.Left],
	[new Input('move_right'), Enum.NormalId.Right],
]);
const Jump = new Input('jump');
const Duck = new Input('duck');

function GetInputDirection(): Vector3 {
	const Thumbstick1 = GetCVar('joy_thumbstick1') as ConVar<Vector3>;
	let wish_dir = new Vector3(Thumbstick1.value.X, 0, -Thumbstick1.value.Y);

	Directions.forEach((normal, input) => {
		if (!input.Active) return;
		wish_dir = wish_dir.add(Vector3.FromNormalId(normal));
	});
	if (wish_dir.Magnitude > 0) wish_dir = wish_dir.Unit;

	return wish_dir;
}

function GetCameraWorldDirection(wish_dir: Vector3): Vector3 {
	const [, camera_y] = Services.Workspace.CurrentCamera!.CFrame.ToOrientation();
	const cam_worlddir = new CFrame().mul(CFrame.Angles(0, camera_y, 0));

	// world direction
	let world_direction = cam_worlddir.VectorToWorldSpace(wish_dir);
	if (world_direction.Magnitude > 0) world_direction = world_direction.Unit;
	return world_direction;
}

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;

	gc_params = new OverlapParams();
	frame_time = 0;
	jumping = false;
	nextframe_skipjump = false;
	walking_dir = new Vector3();

	is_grounded(): boolean {
		if (!Values.Character) return false;

		const CollisionBox_Size_Y = Values.Character.Model.Base.Size.Y;
		const CollisionBox_CFrame = Values.Character.Model.Base.CFrame;

		const cast = Services.Workspace.GetPartBoundsInBox(
			new CFrame(CollisionBox_CFrame.Position).sub(new Vector3(0, CollisionBox_Size_Y / 2, 0)),
			new Vector3(1.5, 0.25, 1.5),
			this.gc_params,
		);

		if (cast.size() > 0) return true;
		return false;
	}

	constructor() {
		this.gc_params.FilterDescendantsInstances = [Folders.Workspace.Map.obj_part];
		this.gc_params.MaxParts = 1;
		this.gc_params.FilterType = Enum.RaycastFilterType.Whitelist;
	}
	Start(): void {}
	FixedUpdate(): void {
		if (!Values.Character) return;

		const CollisionModel = Values.Character.Model;
		CollisionModel.Base.CFrame = new CFrame(CollisionModel.Base.CFrame.Position);

		//wdir
		const world_direction = GetCameraWorldDirection(GetInputDirection());

		this.is_grounded() ? (cmov_p_grounded.value = 1) : (cmov_p_grounded.value = 0);
		if (cmov_p_grounded.value === 1) {
			if (this.jumping) this.nextframe_skipjump ? (this.nextframe_skipjump = false) : (this.jumping = false);
			else this.walking_dir = this.walking_dir.Lerp(world_direction, 0.25);
		}

		// movement
		const curr_vel = CollisionModel.Base.AssemblyLinearVelocity.mul(new Vector3(1, 0, 1));
		const CharacterWalkSpeed = Services.StarterPlayer.CharacterWalkSpeed;
		if (world_direction.Magnitude > 0) {
			if (curr_vel.Magnitude < CharacterWalkSpeed)
				CollisionModel.Base.ApplyImpulse(world_direction.mul(CharacterWalkSpeed));
			else CollisionModel.Base.ApplyImpulse(curr_vel.mul(-1).Unit);
		} else {
			if (curr_vel.Magnitude > 0) CollisionModel.Base.ApplyImpulse(curr_vel.mul(-1).Unit.mul(3));
		}

		// jump
		if (Jump.Active && cmov_p_grounded.value) {
			cmov_p_grounded.value = 0;
			this.jumping = true;
			CollisionModel.Base.AssemblyLinearVelocity = new Vector3(curr_vel.X, 20, curr_vel.Y);
			//Humanoid.ChangeState('Jumping');
		}
	}
	Update(delta_time: number): void {}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
