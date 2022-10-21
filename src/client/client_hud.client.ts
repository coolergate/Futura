task.wait(1);

import RenderPriorities from './components/render';
import console_cmds from './providers/cmds';
import Signals from './providers/signals';
import Values from './providers/values';

Signals.Start.Wait();

const Player = game.GetService('Players').LocalPlayer;
const PlayerGui = Player.WaitForChild('PlayerGui') as PlayerGui;
const RunService = game.GetService('RunService');
const UserInputService = game.GetService('UserInputService');

const OverlayScreenGui = PlayerGui.WaitForChild('Overlay') as ScreenGui;
const GameplayScreenGui = PlayerGui.WaitForChild('Gameplay') as ScreenGui;

const HealthFrame = GameplayScreenGui.FindFirstChild('Health') as Frame;
const WeaponFrame = GameplayScreenGui.FindFirstChild('Weapon') as Frame;

const Overlay_Crosshair = OverlayScreenGui.FindFirstChild('Crosshair') as Frame;
const Overlay_DeadIndicator = Overlay_Crosshair.FindFirstChild('skull') as ImageLabel;

const fps_cores = [new Color3(0, 0.8, 0), new Color3(1, 0.67, 0), new Color3(1, 0, 0)];
const showfps_label = OverlayScreenGui.FindFirstChild('showfps') as TextLabel;
const showpos_label = OverlayScreenGui.FindFirstChild('showpos') as TextLabel;

RunService.BindToRenderStep('interface_pre', RenderPriorities.InterfacePre, (dt) => {
	const Character = Values.CCurrentCharacter;

	const frames_per_second = math.ceil(1 / dt);
	let equivalent_color: Color3 = fps_cores[0];
	if (frames_per_second <= 45 && frames_per_second >= 29) equivalent_color = fps_cores[1];
	else if (frames_per_second <= 28) equivalent_color = fps_cores[2];

	showfps_label.Visible = console_cmds.get('ui_showfps') === 1;
	showpos_label.Visible = console_cmds.get('ui_showpos') === 1;

	showfps_label.Text = tostring(frames_per_second) + ' fps on beta_baseplate';
	showfps_label.TextColor3 = equivalent_color;

	GameplayScreenGui.Enabled = Character !== undefined && Character.Humanoid.Health > 0;
});

RunService.BindToRenderStep('interface_gameplay', RenderPriorities.Interface, (dt) => {
	const Character = Values.CCurrentCharacter;
	if (!GameplayScreenGui.Enabled || !Character) return;

	const HealthLabel = HealthFrame.FindFirstChild('HealthAmount') as TextLabel;
	HealthLabel.Text = tostring(Values.Character.Health);
});

RunService.BindToRenderStep('interface_overlay', RenderPriorities.Interface, (dt) => {
	UserInputService.MouseIconEnabled = !Values.CCameraUnlock.isEmpty() || Values.CCurrentCharacter === undefined;
	Overlay_Crosshair.Visible = !UserInputService.MouseIconEnabled;
});
