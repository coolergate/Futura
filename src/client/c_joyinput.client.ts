//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Handle gamepad input

import { ConVar } from 'shared/components/vars';
import RenderPriorities from './modules/render';

const UserInputService = game.GetService('UserInputService');
const RunService = game.GetService('RunService');

const invert_thumbstick = new ConVar('joy_invert_thumbsticks', 0, 'Invert controller thumbsticks');
const thumbsticks_deadzone = new ConVar('joy_deadzone', 0.05, 'ThumbstickDeadzone');
const Thumbstick1 = new ConVar('joy_thumbstick1', new Vector3(), '', ['Hidden']);
const Thumbstick2 = new ConVar('joy_thumbstick2', new Vector3(), '', ['Hidden']);

RunService.BindToRenderStep('joy_input', RenderPriorities.UserInput + 1, () => {
	UserInputService.GetGamepadState('Gamepad1').forEach(obj => {
		// thumbsticks
		if (obj.KeyCode.Name === 'Thumbstick1') {
			if (obj.Position.Magnitude < thumbsticks_deadzone.value) obj.Position = new Vector3();
			invert_thumbstick.value === 0 ? (Thumbstick1.value = obj.Position) : (Thumbstick2.value = obj.Position);
		} else if (obj.KeyCode.Name === 'Thumbstick2') {
			if (obj.Position.Magnitude < thumbsticks_deadzone.value) obj.Position = new Vector3();
			invert_thumbstick.value === 0 ? (Thumbstick2.value = obj.Position) : (Thumbstick1.value = obj.Position);
		}
	});
});
