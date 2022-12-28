// Author: coolergate#2031
// Reason: Handle user interface

import Values from 'client/providers/values';
import Network from 'shared/network';
import Signals from 'client/providers/signals';
import Roact from '@rbxts/roact';
import { CVar } from 'shared/components/vars';
import { num_string_pad } from 'shared/modules/util';
import { create_fps_label } from 'shared/providers/interface';

Signals.Start.Wait();

//ANCHOR Services
const Players = game.GetService('Players');
const RunService = game.GetService('RunService');
const UserInputService = game.GetService('UserInputService');

const Player = Players.LocalPlayer;
const PlayerGui = Player.WaitForChild('PlayerGui') as PlayerGui;

// cvars
const crosshair_enabled = new CVar('ui_crosshair', 0, 'Toggle crosshair');
const show_fps = new CVar('ui_showfps', 0, 'Toggle FPS meter');
const cvar_accent = new CVar('interface_accent', '255,58,41', 'Change interface accent color', []);

const Holder = PlayerGui.WaitForChild('Main') as ScreenGui;
const GameplayFrame = Holder.FindFirstChild('Game') as Frame;
const SettingsFrame = Holder.FindFirstChild('Settings') as Frame;
const GameplayOverlay = Holder.FindFirstChild('GameOverlay') as Frame;

//SECTION Menu
const MenuCanvas = Holder.FindFirstChild('Menu') as CanvasGroup;
const MenuPanel = MenuCanvas.FindFirstChild('Panel') as Frame;
const MenuPanel_Buttons = MenuPanel.FindFirstChild('Buttons_MainMenu') as Frame;
const MenuPanel_Background = MenuCanvas.FindFirstChild('Background') as ImageLabel;
const MenuPanel_TopText = MenuCanvas.FindFirstChild('TopbarText', true) as TextLabel;

const buttons_callback = new Map<number, () => boolean>();
buttons_callback.set(1, () => {
	//Network.CharacterRespawn.InvokeServer();
	Signals.console_sendarg.Fire('char_respawn');
	return true;
});

MenuPanel_Buttons.GetChildren().forEach(inst => {
	if (!inst.IsA('TextButton')) return;

	const callback = buttons_callback.get(inst.LayoutOrder);
	inst.Activated.Connect(() => {
		if (callback) callback();
	});
});

Signals.Character.Spawned.Connect(() => (MenuCanvas.Visible = false));
Signals.Open_MainMenu.Connect(() => (MenuCanvas.Visible = true));

//!SECTION

//SECTION Settings menu
const settings_panel = SettingsFrame.FindFirstChild('Panel') as Frame;
const settings_selector = settings_panel.FindFirstChild('Selector') as Frame;

settings_selector.GetChildren().forEach(inst => {
	if (!inst.IsA('TextButton')) return;

	inst.Activated.Connect(() => {});
});

const roact_ref = {
	fps_meter_label: Roact.createRef<TextLabel>(),
};

const fps_label = create_fps_label(roact_ref.fps_meter_label);
Roact.mount(fps_label, Holder);

RunService.RenderStepped.Connect(dt => {
	const meter_label = roact_ref.fps_meter_label.getValue()!;
	meter_label.Visible = show_fps.value === 1;
	show_fps.value === 1
		? (meter_label.Text = '<b>' + tostring(math.round(1 / dt)) + 'fps on ${env_mapname}' + '</b>')
		: undefined;

	UserInputService.MouseIconEnabled = !Values.camUnlock.isEmpty() || Values.Character === undefined;

	const crosshair = GameplayFrame.FindFirstChild('Crosshair') as ImageLabel;
	crosshair.Visible = UserInputService.MouseIconEnabled === false && crosshair_enabled.value === 1;

	const Character = Values.Character;

	// toggle gameplay interface
	GameplayFrame.Visible = Character !== undefined && !MenuCanvas.Visible && !SettingsFrame.Visible;

	if (Character === undefined) return;

	const user_health = Character.Health;
	const user_max_health = Character.MaxHealth;

	const HealthPanel = GameplayFrame.FindFirstChild('Health') as unknown as {
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
});
