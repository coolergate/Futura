// Author: coolergate#2031
// Reason: Handle user interface

import Roact from '@rbxts/roact';
import Signals from 'client/providers/signals';
import Values from 'client/providers/values';
import { num_string_pad } from 'shared/util';
import { CVar } from 'shared/vars';

//ANCHOR - Services
const Players = game.GetService('Players');
const RunService = game.GetService('RunService');
const UserInputService = game.GetService('UserInputService');

const Player = Players.LocalPlayer;
const PlayerGui = Player.WaitForChild('PlayerGui') as PlayerGui;
const TweenService = game.GetService('TweenService');

class Component implements BaseClientComponent {
	Player = Players.LocalPlayer;
	PlayerGui = this.Player.WaitForChild('PlayerGui') as PlayerGui;

	CVars = {
		crosshair_enabled: new CVar('ui_crosshair', true, 'Show crosshair'),
		crosshair_mouse: new CVar('ui_crosshair_mouse', false, 'Replace the crosshair with mouse cursor'),
		show_fps: new CVar('ui_fps', false, 'Show fps meter'),
	};

	MainHolder = this.PlayerGui.WaitForChild('Main') as ScreenGui;
	GameplayFrame = this.MainHolder.FindFirstChild('Game') as Frame & {
		Health: Frame & {
			HealthIcon: ImageLabel & {
				Foreground: ImageLabel;
			};
			Amount: TextLabel;
		};
		Weapon: Frame & {
			AmmoIcon: ImageLabel & {
				Foreground: ImageLabel;
			};
			Amount: TextLabel;
		};
		Crosshair: ImageLabel;
	};
	GameplayOverlay = this.MainHolder.FindFirstChild('GameOverlay') as Frame & {
		QuitMessage: Frame;
		Damage: ImageLabel;
	};
	MenuFrame = this.MainHolder.FindFirstChild('Menu') as Frame & {
		Panel: Frame & {
			Buttons_MainMenu: Frame;
		};
	};

	Roact = {
		fps_meter: Roact.createRef<TextLabel>(),
	};

	constructor() {
		//SECTION - Main menu
		const MenuPanel_Callbacks = new Map<string, () => unknown>();
		MenuPanel_Callbacks.set('play', () => {
			Signals.Console_SendCommand.Fire('char_respawn');
		});

		this.MenuFrame.Panel.Buttons_MainMenu.GetChildren().forEach(inst => {
			if (!inst.IsA('TextButton') || !MenuPanel_Callbacks.has(inst.Name)) return;
			inst.Activated.Connect(() => MenuPanel_Callbacks.get(inst.Name)!());
		});
		//TODO - Main menu settings
		//!SECTION

		//SECTION - Build roact elements
		const fps_meter_build = (
			<textlabel
				AnchorPoint={new Vector2(1, 0)}
				AutomaticSize={Enum.AutomaticSize.XY}
				BackgroundTransparency={1}
				Position={new UDim2(1, -5, 0, 5)}
				Size={new UDim2()}
				Font={Enum.Font.RobotoMono}
				RichText={true}
				Text="undefined"
				TextSize={16}
				TextColor3={new Color3(1, 1, 1)}
				Visible={false}
				ZIndex={9}
				Ref={this.Roact.fps_meter}
			/>
		);
		Roact.mount(fps_meter_build, this.MainHolder);
		//!SECTION
	}

	Start(): void {
		this.MenuFrame.Visible = true;
		this.GameplayFrame.Visible = false;

		Signals.Character.Spawned.Connect(info => {
			this.MenuFrame.Visible = false;
		});
		Signals.Character.Died.Connect(info => {
			task.wait(3);
			this.MenuFrame.Visible = true;
		});
		Signals.Character.TookDamage.Connect(() => {
			this.GameplayOverlay.Damage.ImageTransparency = 0;
			TweenService.Create(this.GameplayOverlay.Damage, new TweenInfo(0.15), { ImageTransparency: 1 }).Play();
		});
	}

	FixedUpdate(): void {}

	Update(delta_time: number): void {
		const Character = Values.Character;

		const fps_meter_label = this.Roact.fps_meter.getValue()!;
		fps_meter_label.Visible = this.CVars.show_fps.value;
		this.CVars.show_fps.value
			? (fps_meter_label.Text = '<b>' + tostring(math.round(1 / delta_time)) + 'fps on ${env_mapname}' + '</b>')
			: undefined;

		UserInputService.MouseIconEnabled =
			!Values.Camera_Unlock.isEmpty() || Values.Character === undefined || this.CVars.crosshair_mouse.value;
		this.GameplayFrame.Crosshair.Visible =
			!UserInputService.MouseIconEnabled && this.CVars.crosshair_enabled.value && Character !== undefined;

		this.gameplay_update();
	}

	gameplay_update() {
		const Character = Values.Character;
		this.GameplayFrame.Visible = this.MenuFrame.Visible === false && Character !== undefined;

		if (!Character) return;

		this.GameplayFrame.Health.Amount.Text = num_string_pad(Character.Health, 3);
		this.GameplayFrame.Health.HealthIcon.Foreground.Size = UDim2.fromScale(
			1,
			Character.Health / Character.MaxHealth,
		);

		const weapon = Character.Inventory.Weapons.find(info => {
			return info.Id === Character.EquippedWeapon;
		});

		if (weapon) {
			this.GameplayFrame.Weapon.Visible = true;
			this.GameplayFrame.Weapon.AmmoIcon.Foreground.Size = UDim2.fromOffset(
				1,
				math.clamp(weapon.StoredAmmo / weapon.MaxStoredAmmo, 0, 1),
			);
			this.GameplayFrame.Weapon.Amount.Text = tostring(weapon.StoredAmmo);
		} else this.GameplayFrame.Weapon.Visible = false;
	}
}

export function Init() {
	return new Component();
}
