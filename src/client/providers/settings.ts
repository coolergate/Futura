// Author: coolergate#2031
// Purpose: Class to handle input events

import * as Services from '@rbxts/services';
import { LocalSignal } from 'shared/local_network';

//SECTION - keyboard

// these are the default keybinds, but they can be changed by the user
export const AssignedKeycodes = new Map<Array<string>, string>();
export const CreatedKeycodeEvents = new Array<KeycodeEvent>();

export function bind_unbindall() {
	AssignedKeycodes.forEach((event, keys) => keys.clear());
}

export function bind_unbind(keycode: string) {
	AssignedKeycodes.forEach((event, keys) => {
		if (keys.includes(keycode))
			keys.remove(
				keys.findIndex(str => {
					return str === keycode;
				}),
			);
	});
}

export function bind_key(keybinds: string[], event_name: string) {
	AssignedKeycodes.forEach((_, keys) => {
		keys.remove(
			keys.findIndex(str => {
				return keybinds.includes(str);
			}),
		);
	});
	AssignedKeycodes.set(keybinds, event_name);
}

export class KeycodeEvent {
	readonly Name: string;
	readonly DisplayName: string; // used in settings menu
	readonly Activated = new LocalSignal();
	readonly Deactivated = new LocalSignal();
	Active = false;

	constructor(name: string, DisplayName: string) {
		this.Name = name;
		this.DisplayName = DisplayName;
		CreatedKeycodeEvents.insert(0, this);
	}
}

Services.UserInputService.InputBegan.Connect((input, busy) => {
	if (busy) return;

	const keycode_name = input.KeyCode.Name !== 'Unknown' ? input.KeyCode.Name : input.UserInputType.Name;
	// get event assigned to keycode
	AssignedKeycodes.forEach((event_name, keys) => {
		if (keys.includes(keycode_name)) {
			const equivalent_event = CreatedKeycodeEvents.find(event => {
				return event.Name === event_name;
			});
			if (equivalent_event) {
				equivalent_event.Active = true;
				equivalent_event.Activated.Fire();
			}
		}
	});
});

Services.UserInputService.InputEnded.Connect((input, busy) => {
	if (busy) return;

	const keycode_name = input.KeyCode.Name !== 'Unknown' ? input.KeyCode.Name : input.UserInputType.Name;
	// get event assigned to keycode
	AssignedKeycodes.forEach((event_name, keys) => {
		if (keys.includes(keycode_name)) {
			const equivalent_event = CreatedKeycodeEvents.find(event => {
				return event.Name === event_name;
			});
			if (equivalent_event) {
				equivalent_event.Active = false;
				equivalent_event.Deactivated.Fire();
			}
		}
	});
});

// ANCHOR create events
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

	use: new KeycodeEvent('use', 'Use / Activate'),
	zoom: new KeycodeEvent('zoom', 'Camera zoom'),
};

// ANCHOR assign keycodes
bind_key(['Space', 'ButtonA'], 'jump');
bind_key(['W'], 'move_forward');
bind_key(['S'], 'move_back');
bind_key(['A'], 'move_left');
bind_key(['D'], 'move_right');

// weapons
bind_key(['MouseButton1', 'ButtonR2'], 'attack1');
bind_key(['MouseButton2', 'ButtonL2'], 'attack2');
bind_key(['MouseButton2', 'ButtonR3'], 'zoom');
bind_key(['One'], 'slot1');
bind_key(['Two'], 'slot2');
bind_key(['Three'], 'slot3');
bind_key(['Four'], 'slot4');

//!SECTION Keyboard
