import Signal from '@rbxts/signal';

const UserInputService = game.GetService('UserInputService');
export const Keybinds = new Map<string, string>([
	// movement
	['Space', 'jump'],
	['W', 'move_forward'],
	['S', 'move_back'],
	['A', 'move_left'],
	['D', 'move_right'],

	// weapons
	['MouseButton1', 'attack'],
	['One', 'slot1'],
	['Two', 'slot2'],
	['Three', 'slot3'],
]);

export class Input {
	Active = false;
	readonly Pressed = new Signal();
	readonly Released = new Signal();

	constructor(action: string, toggle = false) {
		UserInputService.InputBegan.Connect((input, busy) => {
			if (busy) return;

			const input_keycode = (input.KeyCode.Name !== 'Unknown' && input.KeyCode.Name) || input.UserInputType.Name;
			const input_equivalentaction = Keybinds.get(input_keycode);
			if (input_equivalentaction !== action) return;
			if (toggle) this.Active !== this.Active;
			else this.Active = true;
			this.Pressed.Fire();
		});
		UserInputService.InputEnded.Connect((input, busy) => {
			if (busy) return;

			const input_keycode = (input.KeyCode.Name !== 'Unknown' && input.KeyCode.Name) || input.UserInputType.Name;
			const input_equivalentaction = Keybinds.get(input_keycode);
			if (input_equivalentaction !== action) return;
			if (!toggle) this.Active = false;
			this.Released.Fire();
		});
	}
}
