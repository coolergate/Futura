// Creator: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';
import * as Defined from 'shared/gamedefined';
import * as Folders from 'shared/folders';

// Wait until the server is ready, should be in normal game
// there is an issue in studio where the player logs on before Players.PlayerAdded
do task.wait(1);
while (!Defined.ServerRunning());

const Player = Services.Players.LocalPlayer;
const PlayerScripts = Player.WaitForChild('PlayerScripts') as PlayerScripts;
const PlayerGui = Player.WaitForChild('PlayerGui') as PlayerGui;

Services.StarterGui.SetCoreGuiEnabled('All', false);

// Build loading screen
const LoadingGui = Folders.Storage.Interface.FindFirstChild('Loading') as ScreenGui & {
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
				CurrentTween = Services.TweenService.Create(Loading_LogoGradient, new TweenInfo(1), {
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

Folders.Storage.Interface.GetChildren().forEach(element => {
	if (element.IsA('ScreenGui')) {
		element.Enabled = true;
		element.Parent = PlayerGui;
	}
});

//=============================================================================
// Pre-Load content and call server login
//=============================================================================
import Signals from './providers/signals';
import Network from 'shared/network';

task.wait(2);
Services.ContentProvider.PreloadAsync(Services.ReplicatedStorage.GetDescendants());
Network.PlayerLogin.InvokeServer().await();

//=============================================================================
// Components
//=============================================================================
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
	InitOrder: number;
	Init(): BaseClientComponent;
}
interface ComponentInfo {
	Name: string;
	InitOrder: number;
	Module: BaseComponentBuilder;
}

const Folder = Player.WaitForChild('PlayerScripts').WaitForChild('TS').FindFirstChild('components') as Folder;
const Components = new Array<ComponentInfo>();
const BuiltComponents = new Array<BaseClientComponent>();

// Add components
Folder.GetChildren().forEach(inst => {
	if (!inst.IsA('ModuleScript')) return;
	const module = require(inst) as BaseComponentBuilder;
	const info: ComponentInfo = {
		Name: inst.Name,
		InitOrder: module.InitOrder,
		Module: module,
	};
	Components.insert(0, info);
});
Components.sort((a, b) => {
	return a.InitOrder < b.InitOrder;
});

// Init
Components.forEach(v => {
	const build = v.Module.Init();
	BuiltComponents.insert(0, build);
});

BuiltComponents.forEach(component =>
	coroutine.wrap(() => {
		component.Start();

		let FrameTime = 0;
		Services.RunService.RenderStepped.Connect(dt => {
			component.Update(dt);
			FrameTime += dt;
			if (FrameTime < 1 / 60) return;
			FrameTime = 0;
			component.FixedUpdate(FrameTime);
		});
	})(),
);

Signals.Start.Fire(); // start non-modules

Services.StarterGui.SetCore('ResetButtonCallback', false);
task.wait(1);

const LoadingScreenFadeOut = Services.TweenService.Create(Loading_Canvas, new TweenInfo(0.5), { GroupTransparency: 1 });
LoadingScreenFadeOut.Play();
LoadingScreenFadeOut.Completed.Wait();

task.wait(1);
LoadingGui.Destroy();

// ! Temporary. will be moved over to another script
Signals.Character_SendRespawnRequest.Call();
