task.wait(1);

import { ConVar } from 'shared/components/vars';
import RenderPriorities from './components/render';
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

const cl_showfps = new ConVar('cl_showfps', false, 'Toggle FPS meter');
const cl_hidenames = new ConVar('cl_hidenames', false, 'Streamer mode');

RunService.BindToRenderStep('interface_pre', RenderPriorities.InterfacePre, (dt) => {
	const Character = Values.Character;

	const frames_per_second = math.ceil(1 / dt);
	let equivalent_color: Color3 = fps_cores[0];
	if (frames_per_second <= 45 && frames_per_second >= 29) equivalent_color = fps_cores[1];
	else if (frames_per_second <= 28) equivalent_color = fps_cores[2];

	showfps_label.Visible = cl_showfps.value === true;

	showfps_label.Text = tostring(frames_per_second) + ' fps on prev_baseplate';
	showfps_label.TextColor3 = equivalent_color;

	GameplayScreenGui.Enabled = Character !== undefined && Character.Health > 0;
});

RunService.BindToRenderStep('interface_gameplay', RenderPriorities.Interface, (dt) => {
	const Character = Values.Character;
	if (!GameplayScreenGui.Enabled || !Character) return;

	const HealthLabel = HealthFrame.FindFirstChild('HealthAmount') as TextLabel;
	HealthLabel.Text = tostring(Values.Character.Health);
});

RunService.BindToRenderStep('interface_overlay', RenderPriorities.Interface, (dt) => {
	UserInputService.MouseIconEnabled = !Values.CCameraUnlock.isEmpty() || Values.Character.CollisionBox === undefined;
	Overlay_Crosshair.Visible = !UserInputService.MouseIconEnabled;
});
