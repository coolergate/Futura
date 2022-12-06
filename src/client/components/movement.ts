// Creator: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';
import Values from 'client/providers/values';
import { Input } from 'client/modules/input';
import { ConVar, GetCVar } from 'shared/components/vars';

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;

	gc_params = new OverlapParams();
	frame_time = 0;
	grounded = false;
	jumping = false;
	nextframe_skipjump = false;
	walking_dir = new Vector3();

	cvars = {
		duck_method: new ConVar('cmov_duck_method', 0, ''),
	};

	bindings = {
		Directions: new Map<Input, Enum.NormalId>([
			[new Input('move_forward'), Enum.NormalId.Front],
			[new Input('move_back'), Enum.NormalId.Back],
			[new Input('move_left'), Enum.NormalId.Left],
			[new Input('move_right'), Enum.NormalId.Right],
		]),

		Jump: new Input('jump'),
		Duck: new Input('duck'),
	};

	is_grounded(): boolean {
		if (!Values.Character.CollisionBox) return false;

		const CollisionBox_Size_Y = Values.Character.CollisionBox.HumanoidRootPart.Size.Y;
		const CollisionBox_CFrame = Values.Character.CollisionBox.HumanoidRootPart.CFrame;

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
		const CollisionModel = Values.Character.CollisionBox;
		const Humanoid = CollisionModel?.Humanoid;
		if (!CollisionModel || !Humanoid) return;

		CollisionModel.HumanoidRootPart.CFrame = new CFrame(CollisionModel.HumanoidRootPart.CFrame.Position);

		// wish direction
		const Thumbstick1 = GetCVar('joy_thumbstick1') as ConVar<Vector3>;
		let wish_dir = new Vector3(Thumbstick1.value.X, 0, -Thumbstick1.value.Y);

		this.bindings.Directions.forEach((normal, input) => {
			if (!input.Active) return;
			wish_dir = wish_dir.add(Vector3.FromNormalId(normal));
		});
		if (wish_dir.Magnitude > 0) wish_dir = wish_dir.Unit;

		const [, camera_y] = Services.Workspace.CurrentCamera!.CFrame.ToOrientation();
		const cam_worlddir = new CFrame().mul(CFrame.Angles(0, camera_y, 0));

		// world direction
		let world_direction = cam_worlddir.VectorToWorldSpace(wish_dir);
		if (world_direction.Magnitude > 0) world_direction = world_direction.Unit;

		//this.grounded = this.is_grounded();
		this.grounded = Humanoid.FloorMaterial.Name !== 'Air';
		if (this.grounded) {
			if (this.jumping) this.nextframe_skipjump ? (this.nextframe_skipjump = false) : (this.jumping = false);
			else this.walking_dir = this.walking_dir.Lerp(world_direction, 0.25);
		}

		Humanoid.Move(this.walking_dir, false);

		// jump
		if (this.bindings.Jump.Active && this.grounded) {
			this.grounded = false;
			this.jumping = true;
			Humanoid.ChangeState('Jumping');
		}
	}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
