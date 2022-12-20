// Creator: coolergate#2031
// Purpose: Gamepad / Controller input handler

import * as Services from '@rbxts/services';
import { ConVar } from 'shared/components/vars';

//cvars
const gamepad_enabled = new ConVar('joy_enabled', false, 'Toggle gamepad support', ['Readonly']);
const invert_thumbstick = new ConVar('joy_invert_thumbsticks', 0, 'Invert controller thumbsticks');
const thumbsticks_deadzone = new ConVar('joy_deadzone', 0.05, 'ThumbstickDeadzone');
const Thumbstick1 = new ConVar('joy_thumbstick1', new Vector3(), '', ['Hidden']);
const Thumbstick2 = new ConVar('joy_thumbstick2', new Vector3(), '', ['Hidden']);

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;

	constructor() {}
	Start(): void {}
	FixedUpdate(): void {}
	Update(delta_time: number): void {
		gamepad_enabled.value = Services.UserInputService.GamepadEnabled;

		Services.UserInputService.GetGamepadState('Gamepad1').forEach(obj => {
			// thumbsticks
			if (obj.KeyCode.Name === 'Thumbstick1') {
				if (obj.Position.Magnitude < thumbsticks_deadzone.value) obj.Position = new Vector3();
				invert_thumbstick.value === 0 ? (Thumbstick1.value = obj.Position) : (Thumbstick2.value = obj.Position);
			} else if (obj.KeyCode.Name === 'Thumbstick2') {
				if (obj.Position.Magnitude < thumbsticks_deadzone.value) obj.Position = new Vector3();
				invert_thumbstick.value === 0 ? (Thumbstick2.value = obj.Position) : (Thumbstick1.value = obj.Position);
			}
		});
	}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
