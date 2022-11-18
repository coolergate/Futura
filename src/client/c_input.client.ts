//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Client input manager

import { ConVar } from 'shared/components/vars';
import Signals from './providers/signals';
Signals.Start.Wait();

//=============================================================================
// Services
//=============================================================================
const UserInputService = game.GetService('UserInputService');
const RunService = game.GetService('RunService');

//=============================================================================
// ConVars
//=============================================================================
const joy_RXValue = new ConVar('joy_RXValue', 0, '', ['Hidden']); // Right stick
const joy_RYValue = new ConVar('joy_RYValue', 0, '', ['Hidden']); // Right stick
const joy_LXValue = new ConVar('joy_LYValue', 0, '', ['Hidden']); // Left stick
const joy_LYValue = new ConVar('joy_LYValue', 0, '', ['Hidden']); // Left stick

//=============================================================================
// Keyboard management
//=============================================================================
const Keybindings = new Map<string, string>();
UserInputService.InputBegan.Connect((input, busy) => {
	if (busy) return;

	const keycode = (input.KeyCode.Name !== 'Unknown' && input.KeyCode.Name) || input.UserInputType.Name;
	const command = Keybindings.get(keycode);
	if (command !== undefined) Signals.SendConsoleCommand.Fire(command);
});
UserInputService.InputBegan.Connect((input, busy) => {
	if (busy) return;

	const keycode = (input.KeyCode.Name !== 'Unknown' && input.KeyCode.Name) || input.UserInputType.Name;
	const command = Keybindings.get(keycode);
	if (command !== undefined) {
		if (command.sub(1, 1) === '-') Signals.SendConsoleCommand.Fire(command);
	}
});
