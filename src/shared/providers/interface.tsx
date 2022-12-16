// Creator: coolergate#2031
// Purpose:

import Roact from '@rbxts/roact';

export function create_fps_label(ref?: Roact.Ref<TextLabel>) {
	return (
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
			Ref={ref}
		/>
	);
}
