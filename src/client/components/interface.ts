// Creator: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import Values from 'client/providers/values';
import Network from 'shared/network';
import Signals from 'client/providers/signals';
import Roact from '@rbxts/roact';
import { ConVar } from 'shared/components/vars';
import { num_string_pad } from 'shared/modules/util';
import { create_fps_label } from 'shared/providers/interface';

// cvars
const crosshair_enabled = new ConVar('ui_crosshair', 0, 'Toggle crosshair');
const show_fps = new ConVar('ui_showfps', 0, 'Toggle FPS meter');

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;
	PlayerGui = this.Player.WaitForChild('PlayerGui') as PlayerGui;

	Holder: ScreenGui;
	MainMenuFrame: Frame;
	GameplayFrame: Frame;
	GameplayOverlay: Frame;

	// roact refs
	roact_ref = {
		fps_meter_label: Roact.createRef<TextLabel>(),
	};

	constructor() {
		this.Holder = this.PlayerGui.WaitForChild('Main') as ScreenGui;
		this.MainMenuFrame = this.Holder.FindFirstChild('Menu') as Frame;
		this.GameplayFrame = this.Holder.FindFirstChild('Game') as Frame;
		this.GameplayOverlay = this.Holder.FindFirstChild('GameOverlay') as Frame;

		const fps_label = create_fps_label(this.roact_ref.fps_meter_label);
		Roact.mount(fps_label, this.Holder);
	}
	Start(): void {
		const MainHolder = this.PlayerGui.FindFirstChild('Main') as ScreenGui;
		this.MainMenuFrame.Visible = false;

		// Main menu
		const MM_buttons = this.MainMenuFrame.FindFirstChild('Buttons') as Frame;
		const MM_background = this.MainMenuFrame.FindFirstChild('BackgroundDark') as Frame;
		const MM_bar_top_left = this.MainMenuFrame.FindFirstChild('Topbar_Left') as Frame;
		const MM_bar_top_background = MainHolder.FindFirstChild('Topbar_Background') as Frame;
		const MM_changelogs = MainHolder.FindFirstChild('Changelogs') as Frame;

		const buttons_callback = new Map<number, () => boolean>();
		buttons_callback.set(1, () => {
			Signals.console_sendarg.Fire('char_respawn');
			return true;
		});

		MM_buttons.GetChildren().forEach(inst => {
			if (!inst.IsA('TextButton')) return;

			const callback = buttons_callback.get(inst.LayoutOrder);
			inst.Activated.Connect(() => {
				if (callback) callback();
			});
		});

		Signals.ui_open_mainmenu.Connect(() => {
			this.MainMenuFrame.Visible = true;
		});

		Signals.Character.Spawned.Connect(() => (this.MainMenuFrame.Visible = false));
	}
	Update(delta_time: number): void {
		const meter_label = this.roact_ref.fps_meter_label.getValue()!;
		meter_label.Visible = show_fps.value === 1;
		show_fps.value === 1
			? (meter_label.Text = '<b>' + tostring(math.round(1 / delta_time)) + 'fps on ${env_mapname} </b>')
			: undefined;

		Services.UserInputService.MouseIconEnabled = !Values.camUnlock.isEmpty() || Values.Character === undefined;

		const crosshair = this.GameplayOverlay.FindFirstChild('Crosshair') as ImageLabel;
		crosshair.Visible = Services.UserInputService.MouseIconEnabled === false && crosshair_enabled.value === 1;
	}

	FixedUpdate(delta_time: number): void {
		const Character = Values.Character;

		// toggle gameplay interface
		this.GameplayFrame.Visible = Character !== undefined && this.MainMenuFrame.Visible === false;

		if (Character === undefined) return;

		const user_health = Character.health;
		const user_max_health = Character.health_max;

		const HealthPanel = this.GameplayFrame.FindFirstChild('Health') as unknown as {
			HealthIcon: {
				Foreground: TextLabel;
			};
			Amount: TextLabel;
		};

		HealthPanel.Amount.Text = num_string_pad(user_health, 3);
		HealthPanel.HealthIcon.Foreground.Size = HealthPanel.HealthIcon.Foreground.Size.Lerp(
			UDim2.fromScale(1, user_health / user_max_health),
			0.25,
		);
	}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
