// Author: coolergate#2031
// Reason: Initialize client

import * as Folders from 'shared/folders';
import * as Signals from './providers/signals';
import * as Network from 'shared/network';
import placeinfo from 'shared/placeinfo';
import Values from './providers/values';
import { CreatedVars, CVar } from 'shared/vars';

const ReplicatedStorage = game.GetService('ReplicatedStorage');
const UserInputService = game.GetService('UserInputService');
const ContentProvider = game.GetService('ContentProvider');
const TweenService = game.GetService('TweenService');
const RunService = game.GetService('RunService');
const StarterGui = game.GetService('StarterGui');
const Players = game.GetService('Players');

const Player = Players.LocalPlayer;
const PlayerGui = Player.WaitForChild('PlayerGui') as PlayerGui;

StarterGui.SetCoreGuiEnabled('All', false);

//ANCHOR Interface
const LoadingGui = Folders.Interface.FindFirstChild('Loading') as ScreenGui & {
	Main: CanvasGroup & {
		Logo: TextLabel & {
			UIGradient: UIGradient;
		};
		Info: TextLabel;
	};
};

LoadingGui.Parent = PlayerGui;
LoadingGui.Enabled = true;
const Loading_Canvas = LoadingGui.Main;
const Loading_InfoText = Loading_Canvas.Info;
const Loading_LogoGradient = Loading_Canvas.Logo.UIGradient;
{
	let CurrentTween: Tween | undefined;
	Loading_LogoGradient.Offset = new Vector2(-1, 0);

	Loading_InfoText.Text = '';

	coroutine.wrap(() => {
		do {
			if (!CurrentTween) {
				Loading_LogoGradient.Offset = new Vector2(-1, 0);
				CurrentTween = TweenService.Create(Loading_LogoGradient, new TweenInfo(1), {
					Offset: new Vector2(1, 0),
				});
				CurrentTween.Play();
				CurrentTween.Completed.Wait();
				task.wait(1);
				CurrentTween?.Destroy();
				CurrentTween = undefined;
			} else task.wait();
		} while (PlayerGui.FindFirstChild('Loading') !== undefined);
	})();
}

Folders.Interface.GetChildren().forEach(element => {
	if (element.IsA('ScreenGui')) {
		element.Enabled = true;
		element.Parent = PlayerGui;
	}
});

//=============================================================================
// Pre-Load content and call server login
//=============================================================================
task.wait(5);
const List = ReplicatedStorage.GetDescendants();
List.sort((a, b) => {
	return a.ClassName > b.ClassName;
});
List.forEach((inst, index) => {
	Loading_InfoText.Text = `Loading ${inst.ClassName}... (${index} / ${List.size()})`;
	ContentProvider.PreloadAsync([inst]);
});

Loading_InfoText.Text = 'Sending login request...';
Network.PlayerLogin.InvokeServer().await();

//=============================================================================
// Components
//=============================================================================
Loading_InfoText.Text = 'Initializing components...';
declare global {
	interface BaseClientComponent {
		/**
		 * Called in sync with other scripts
		 */
		Start(): void;

		/**
		 * Called every frame
		 */
		Update(delta_time: number): void;

		/**
		 * Called every frame when it matches 60FPS
		 */
		FixedUpdate(delta_time: number): void;
	}
}
interface BaseComponentBuilder {
	Init(): BaseClientComponent;
}
interface ComponentInfo {
	Name: string;
	Module: BaseComponentBuilder;
}

const Folder = Folders.MainScriptFolder.FindFirstChild('components') as Folder;
const Components = new Array<ComponentInfo>();
const BuiltComponents = new Array<BaseClientComponent>();

// Add components
Folder.GetChildren().forEach(inst => {
	if (!inst.IsA('ModuleScript')) return;
	Signals.Console_RenderMessage.Fire('Info', `Adding component to list: ${inst.Name}`);
	const module = require(inst) as BaseComponentBuilder;
	const info: ComponentInfo = {
		Name: inst.Name,
		Module: module,
	};
	Components.insert(0, info);
});
// Init
Components.forEach(v => {
	Signals.Console_RenderMessage.Fire('Info', `Initializing component: ${v.Name}`);
	const build = v.Module.Init();
	BuiltComponents.insert(0, build);
});

BuiltComponents.forEach(component =>
	coroutine.wrap(() => {
		component.Start();

		let FrameTime = 0;
		RunService.RenderStepped.Connect(dt => {
			component.Update(dt);
			FrameTime += dt;
			if (FrameTime < 1 / 60) return;
			FrameTime = 0;
			component.FixedUpdate(FrameTime);
		});
	})(),
);

Signals.Start.Fire(); // start non-modules

StarterGui.SetCore('ResetButtonCallback', false);
task.wait(1);

// space to continue
Loading_InfoText.Text = 'Press <font color="rgb(255,58,41)">SPACE</font> to continue';
let wait_for_input = true;
const input_connection = UserInputService.InputBegan.Connect(input => {
	if (input.KeyCode.Name !== 'Space' && input.KeyCode.Name !== 'ButtonA') return;
	wait_for_input = false;
});
while (wait_for_input) RunService.RenderStepped.Wait();
input_connection.Disconnect();
Signals.GUI_OpenMenu.Fire();

const LoadingScreenFadeOut = TweenService.Create(Loading_Canvas, new TweenInfo(0.5), { GroupTransparency: 1 });
LoadingScreenFadeOut.Completed.Connect(() => {
	Loading_Canvas.Destroy();
	LoadingScreenFadeOut.Destroy();
});
LoadingScreenFadeOut.Play();
