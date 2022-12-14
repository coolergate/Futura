// Author: coolergate#2031
// Reason: Handle user input

import { CVar } from 'shared/vars';
import { LocalSignal } from 'shared/local_network';

const UserInputService = game.GetService('UserInputService');
const RunService = game.GetService('RunService');

export const AssignedKeycodes = new Map<string, KeycodeEvent>();
export const KeycodeEvent_List = new Array<KeycodeEvent>();

export class KeycodeEvent {
	readonly PointerName: string;
	readonly DisplayName: string; // used in settings menu
	readonly Activated = new LocalSignal();
	readonly Deactivated = new LocalSignal();
	Active = false;

	constructor(pname: string, dname: string) {
		this.PointerName = pname;
		this.DisplayName = dname;
		KeycodeEvent_List.insert(0, this);
	}
}

export function bind_key(key: string, action: string) {
	const equivalent_action = KeycodeEvent_List.find(event => {
		return event.PointerName === action;
	});
	equivalent_action !== undefined ? AssignedKeycodes.set(key, equivalent_action) : warn(action, 'does not exist.');
}

export function UnbindKeycode(key: string) {
	AssignedKeycodes.delete(key);
}

UserInputService.InputBegan.Connect((input, busy) => {
	if (busy) return;

	const keycode_name = input.KeyCode.Name !== 'Unknown' ? input.KeyCode.Name : input.UserInputType.Name;
	// get event assigned to keycode
	AssignedKeycodes.forEach((event, keycode) => {
		if (keycode === keycode_name) {
			event.Active = true;
			event.Activated.Fire();
		}
	});
});
UserInputService.InputEnded.Connect((input, busy) => {
	if (busy) return;

	const keycode_name = input.KeyCode.Name !== 'Unknown' ? input.KeyCode.Name : input.UserInputType.Name;
	// get event assigned to keycode
	AssignedKeycodes.forEach((event, keycode) => {
		if (keycode === keycode_name) {
			event.Active = false;
			event.Deactivated.Fire();
		}
	});
});

// ANCHOR Gamepad input
export let GamepadEnabled = false;
export let Thumbstick1 = new Vector3();
export let Thumbstick2 = new Vector3();
export const InvertThumbsticks = new CVar('joy_invert_thumbsticks', false, 'Invert controller thumbsticks');
export const ThumbstickDeadzone = new CVar('joy_deadzone', 0.05, 'Controller thumbstick deadzone');
RunService.RenderStepped.Connect(dt => {
	GamepadEnabled = UserInputService.GetGamepadConnected('Gamepad1');
	if (!GamepadEnabled) return;

	UserInputService.GetGamepadState('Gamepad1').forEach(obj => {
		// thumbsticks
		if (obj.KeyCode.Name === 'Thumbstick1') {
			if (obj.Position.Magnitude < ThumbstickDeadzone.value) obj.Position = new Vector3();
			!InvertThumbsticks.value ? (Thumbstick1 = obj.Position) : (Thumbstick2 = obj.Position);
		}
		if (obj.KeyCode.Name === 'Thumbstick2') {
			if (obj.Position.Magnitude < ThumbstickDeadzone.value) obj.Position = new Vector3();
			!InvertThumbsticks.value ? (Thumbstick2 = obj.Position) : (Thumbstick1 = obj.Position);
		}
	});
});

// ANCHOR Create default KeycodeEvents
export const KeycodeEvents = {
	jump: new KeycodeEvent('jump', 'Jump'),
	duck: new KeycodeEvent('duck', 'Crouch'),
	move_forward: new KeycodeEvent('move_forward', 'Move Forward'),
	move_back: new KeycodeEvent('move_back', 'Move Backward'),
	move_left: new KeycodeEvent('move_left', 'Strafe Left'),
	move_right: new KeycodeEvent('move_right', 'Strafe Right'),

	attack1: new KeycodeEvent('attack1', 'Primary Fire'),
	attack2: new KeycodeEvent('attack2', 'Secondary Fire'),
	attack3: new KeycodeEvent('attack3', 'Special Fire'),
	reload: new KeycodeEvent('reload', 'Reload Weapon'),
	slot1: new KeycodeEvent('slot1', 'Primary weapon'),
	slot2: new KeycodeEvent('slot2', 'Secondary weapon'),
	slot3: new KeycodeEvent('slot3', 'Melee weapon'),

	use: new KeycodeEvent('use', 'Use / Activate'),
	//zoom: new KeycodeEvent('zoom', 'Camera zoom'),
};

// ANCHOR Assign default keycodes
bind_key('Space', 'jump');
bind_key('ButtonA', 'jump');

bind_key('W', 'move_forward');
bind_key('S', 'move_back');
bind_key('A', 'move_left');
bind_key('D', 'move_right');

bind_key('E', 'use');

// weapons
bind_key('MouseButton1', 'attack1');
bind_key('ButtonR2', 'attack1');

bind_key('MouseButton2', 'attack2');
bind_key('ButtonL2', 'attack2');

bind_key('MouseButton2', 'zoom');
bind_key('ButtonR3', 'zoom');

bind_key('One', 'slot1');
bind_key('Two', 'slot2');
bind_key('Three', 'slot3');
