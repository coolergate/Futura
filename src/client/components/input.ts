import Signal from '@rbxts/signal';
import Keybinds from 'client/providers/buttons';

const UserInputService = game.GetService('UserInputService');

export = class {
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
};
