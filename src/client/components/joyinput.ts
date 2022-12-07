// Creator: coolergate#2031
// Purpose: Gamepad / Controller input handler

import * as Services from '@rbxts/services';
import { ConVar } from 'shared/components/vars';

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;

	cvars = {
		invert_thumbstick: new ConVar('joy_invert_thumbsticks', 0, 'Invert controller thumbsticks'),
		thumbsticks_deadzone: new ConVar('joy_deadzone', 0.05, 'ThumbstickDeadzone'),
		Thumbstick1: new ConVar('joy_thumbstick1', new Vector3(), '', ['Hidden']),
		Thumbstick2: new ConVar('joy_thumbstick2', new Vector3(), '', ['Hidden']),
	};

	constructor() {}
	Start(): void {}
	FixedUpdate(): void {}
	Update(delta_time: number): void {
		Services.UserInputService.GetGamepadState('Gamepad1').forEach(obj => {
			// thumbsticks
			if (obj.KeyCode.Name === 'Thumbstick1') {
				if (obj.Position.Magnitude < this.cvars.thumbsticks_deadzone.value) obj.Position = new Vector3();
				this.cvars.invert_thumbstick.value === 0
					? (this.cvars.Thumbstick1.value = obj.Position)
					: (this.cvars.Thumbstick2.value = obj.Position);
			} else if (obj.KeyCode.Name === 'Thumbstick2') {
				if (obj.Position.Magnitude < this.cvars.thumbsticks_deadzone.value) obj.Position = new Vector3();
				this.cvars.invert_thumbstick.value === 0
					? (this.cvars.Thumbstick2.value = obj.Position)
					: (this.cvars.Thumbstick1.value = obj.Position);
			}
		});
	}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
