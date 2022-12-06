// Creator: coolergate#2031
// Purpose: User interface manager

import { ConVar } from 'shared/components/vars';
import * as Folders from 'shared/folders';
import { num_string_pad } from 'shared/modules/util';
import RenderPriorities from './modules/render';
import Signals from './providers/signals';
import Values from './providers/values';

Signals.Start.Wait();

const Player = game.GetService('Players').LocalPlayer;
const PlayerGui = Player.WaitForChild('PlayerGui') as PlayerGui;
const RunService = game.GetService('RunService');
const UserInputService = game.GetService('UserInputService');

//=============================================================================
// ConVars
//=============================================================================
const cl_crosshair_size = new ConVar('crosshair_size', 40, 'Crosshair size');
const cl_crosshair_img = new ConVar('crosshair_image', 4698797324, 'Crosshair image');
const cl_crosshair = new ConVar('crosshair', 1, 'Toggle crosshair');
const cl_hidenames = new ConVar('cl_hidenames', 0, 'Streamer mode');
const cl_showfps = new ConVar('cl_showfps', 0, 'Toggle FPS meter');
const cl_drawhud = new ConVar('cl_drawhud', 1, 'Draw HUD');

//=============================================================================
// Retrieve interface elements
//=============================================================================
const Holder = PlayerGui.WaitForChild('Main') as ScreenGui;
const GameplayFrame = Holder.FindFirstChild('Game') as Frame;
const OverlayFrame = Holder.FindFirstChild('GameOverlay') as Frame;

const Crosshair = OverlayFrame.FindFirstChild('Crosshair') as ImageLabel;

RunService.BindToRenderStep('interface_pre', RenderPriorities.InterfacePre, dt => {
	const Character = Values.Character;
	GameplayFrame.Visible = Character.CollisionBox !== undefined && Character.Health > 0;
});

RunService.BindToRenderStep('interface_gameplay', RenderPriorities.Interface, dt => {
	const Character = Values.Character;
	if (!GameplayFrame.Visible || !Character.CollisionBox) return;

	// Health meter
	const CurrentHealth = Values.Character.Health;
	const CurerntMaxHealth = Values.Character.MaxHealth;

	const HealthPanel = GameplayFrame.FindFirstChild('Health') as unknown as {
		HealthIcon: {
			Foreground: TextLabel;
		};
		Amount: TextLabel;
	};

	HealthPanel.Amount.Text = num_string_pad(CurrentHealth, 3);
	HealthPanel.HealthIcon.Foreground.Size = UDim2.fromScale(1, CurrentHealth / CurerntMaxHealth);
});

RunService.BindToRenderStep('interface_overlay', RenderPriorities.Interface, dt => {
	UserInputService.MouseIconEnabled = !Values.CCameraUnlock.isEmpty() || Values.Character.CollisionBox === undefined;
	Crosshair.Visible = UserInputService.MouseIconEnabled === false && cl_crosshair.value === 1;
});

RunService.RenderStepped.Connect(dt => {
	if (cl_showfps.value === 1) {
		let fps_meter_label = OverlayFrame.FindFirstChild('showfps') as TextLabel | undefined;
		if (!fps_meter_label) {
			fps_meter_label = new Instance('TextLabel', OverlayFrame);
			fps_meter_label.AnchorPoint = new Vector2(1, 0);
			fps_meter_label.BackgroundTransparency = 1;
			fps_meter_label.Position = new UDim2(1, -5, 0, 5);
			fps_meter_label.Size = new UDim2();
			fps_meter_label.Font = Enum.Font.RobotoMono;
			fps_meter_label.RichText = true;
			fps_meter_label.Text = `undefined`;
			fps_meter_label.Name = 'showfps';
			fps_meter_label.TextStrokeTransparency = 0.95;
		}

		const amount_fps = math.round(1 / dt);
		fps_meter_label.Text = tostring(amount_fps) + 'fps on ${ENV_MAPNAME}';
	} else OverlayFrame.FindFirstChild('showfps')?.Destroy();
});
