// Creator: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import Values from 'client/providers/values';
import Roact from '@rbxts/roact';
import { ConVar } from 'shared/components/vars';
import { num_string_pad } from 'shared/modules/util';

const fps_meter_label = (
	<textlabel
		AnchorPoint={new Vector2(1, 0)}
		BackgroundTransparency={1}
		Position={new UDim2(1, -5, 0, 5)}
		Size={new UDim2()}
		Font={Enum.Font.RobotoMono}
		RichText={true}
		Text="undefined"
	/>
);

class Component implements BaseClientComponent {
	Player = Services.Players.LocalPlayer;
	PlayerGui = this.Player.WaitForChild('PlayerGui') as PlayerGui;

	cvars = {
		crosshair_enabled: new ConVar('crosshair', 1, 'Toggle crosshair'),
		show_fps: new ConVar('cl_showfps', 0, 'Toggle FPS meter'),
	};

	Holder: ScreenGui;
	GameplayFrame: Frame;
	GameplayOverlay: Frame;

	// roact refs
	roact_ref = {
		fps_meter_label: Roact.createRef<TextLabel>(),
	};

	constructor() {
		this.Holder = this.PlayerGui.WaitForChild('Main') as ScreenGui;
		this.GameplayFrame = this.Holder.FindFirstChild('Game') as Frame;
		this.GameplayOverlay = this.Holder.FindFirstChild('GameOverlay') as Frame;

		const fps_label = (
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
				Ref={this.roact_ref.fps_meter_label}
			/>
		);

		Roact.mount(fps_label, this.Holder);
	}
	Start(): void {}
	Update(delta_time: number): void {
		const meter_label = this.roact_ref.fps_meter_label.getValue()!;
		meter_label.Visible = this.cvars.show_fps.value === 1;
		this.cvars.show_fps.value === 1
			? (meter_label.Text = '<b>' + tostring(math.round(1 / delta_time)) + 'fps on ${env_mapname} </b>')
			: undefined;

		Services.UserInputService.MouseIconEnabled =
			!Values.CCameraUnlock.isEmpty() || Values.Character.CollisionBox === undefined;

		const crosshair = this.GameplayOverlay.FindFirstChild('Crosshair') as ImageLabel;
		crosshair.Visible =
			Services.UserInputService.MouseIconEnabled === false && this.cvars.crosshair_enabled.value === 1;
	}

	FixedUpdate(delta_time: number): void {
		const Character = Values.Character;
		if (!Character.CollisionBox) return;

		const user_health = Values.Character.Health;
		const user_max_health = Values.Character.MaxHealth;

		const HealthPanel = this.GameplayFrame.FindFirstChild('Health') as unknown as {
			HealthIcon: {
				Foreground: TextLabel;
			};
			Amount: TextLabel;
		};

		HealthPanel.Amount.Text = num_string_pad(user_health, 3);
		HealthPanel.HealthIcon.Foreground.Size = UDim2.fromScale(1, user_health / user_max_health);
	}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
