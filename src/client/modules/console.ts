//========= Copyright GGC Studios, All rights reserved. ============//
// Purpose: Initialize console on the client               					//
//==================================================================//

import { Prefer } from '@rbxts/clack';

const RunService = game.GetService('RunService');
const UserInputService = game.GetService('UserInputService');

if (!script.Parent!.Name !== 'modules') return;
if (!RunService.IsClient()) return;
if (new Prefer().getPreferredInput() === Clack.InputType.Gamepad) return; // disable for consoles

const config = {
  developer: false,
  disabled: false,
};

UserInputService.InputBegan.Connect((input, busy) => {
  if (busy || config.disabled) return;
});
