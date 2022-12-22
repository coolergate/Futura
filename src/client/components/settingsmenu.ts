// Author: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import * as SettingsModule from '../providers/settings';

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;

	constructor() {}
	Start(): void {
		const Interface = this.Player.WaitForChild('PlayerGui')
			.WaitForChild('Main')
			.WaitForChild('Settings') as ScreenGui;
	}
	FixedUpdate(): void {}
	Update(delta_time: number): void {}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
