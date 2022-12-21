// Author: coolergate#2031
// Purpose: Class to handle input events

import * as Services from '@rbxts/services';
import { LocalSignal } from 'shared/local_network';

//SECTION - keyboard

export const keycodes = new Map<Array<string>, string>([
	// movement
	[['Space', 'ButtonA'], 'jump'],
	[['W'], 'move_forward'],
	[['S'], 'move_back'],
	[['A'], 'move_left'],
	[['D'], 'move_right'],

	// weapons
	[['MouseButton1'], 'attack'],
	[['One'], 'slot1'],
	[['Two'], 'slot2'],
	[['Three'], 'slot3'],
]);
const CreatedEvents = new Array<KeycodeEvent>();

export class KeycodeEvent {
	readonly Name: string;
	readonly Activated = new LocalSignal();
	readonly Deactivated = new LocalSignal();
	Active = false;

	constructor(name: string) {
		this.Name = name;
	}
}

Services.UserInputService.InputBegan.Connect((input, busy) => {
	if (busy) return;

	const keycode_name = input.KeyCode.Name !== 'Unknown' ? input.KeyCode.Name : input.UserInputType.Name;
	// get event assigned to keycode
	keycodes.forEach((event_name, keys) => {
		if (keys.includes(keycode_name)) {
			const equivalent_event = CreatedEvents.find(event => {
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
	keycodes.forEach((event_name, keys) => {
		if (keys.includes(keycode_name)) {
			const equivalent_event = CreatedEvents.find(event => {
				return event.Name === event_name;
			});
			if (equivalent_event) {
				equivalent_event.Active = false;
				equivalent_event.Deactivated.Fire();
			}
		}
	});
});
//!SECTION
