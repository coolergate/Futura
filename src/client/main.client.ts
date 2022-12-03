//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Startup script.

const ReplicatedStorage = game.GetService('ReplicatedStorage');
const ContentProvider = game.GetService('ContentProvider');
const TweenService = game.GetService('TweenService');
const RunService = game.GetService('RunService');
const StarterGui = game.GetService('StarterGui');
const Player = game.GetService('Players').LocalPlayer;
const PlayerGui = Player.WaitForChild('PlayerGui') as PlayerGui;

// ^ Wait until the server is ready, should be in normal game
// ^ but there is an issue with studio that the player logs on
// ^ before Players.PlayerAdded is called
do task.wait(1);
while (ReplicatedStorage.GetAttribute('Running') !== true);

//=============================================================================
// Loading screen
//=============================================================================
import { Folders } from 'shared/global_resources';

Folders.Storage.UserInterface.GetChildren().forEach(element => {
	if (element.IsA('ScreenGui')) {
		element.Enabled = true;
		element.Parent = PlayerGui;
	}
});

const InterfaceHolder = PlayerGui.FindFirstChild('Main') as ScreenGui;
const LoadingInterfaceCanvas = InterfaceHolder.FindFirstChild('LoadingOverlay') as CanvasGroup;
{
	LoadingInterfaceCanvas.Visible = true;
	StarterGui.SetCoreGuiEnabled('All', false);

	let CurrentTween: Tween | undefined;
	const TextGradient = LoadingInterfaceCanvas.FindFirstChild('UIGradient', true) as UIGradient;
	TextGradient.Offset = new Vector2(-1, 0);

	coroutine.wrap(() => {
		do {
			if (!CurrentTween) {
				TextGradient.Offset = new Vector2(-1, 0);
				CurrentTween = TweenService.Create(TextGradient, new TweenInfo(1), { Offset: new Vector2(1, 0) });
				CurrentTween.Play();
				CurrentTween.Completed.Wait();
				task.wait(1);
				CurrentTween?.Destroy();
				CurrentTween = undefined;
			} else task.wait();
		} while (LoadingInterfaceCanvas !== undefined);
	})();
}

//=============================================================================
// Pre-Load content and call server login
//=============================================================================
import Signals from './providers/signals';
import Network from 'shared/network';

task.wait(2);
ContentProvider.PreloadAsync(ReplicatedStorage.GetDescendants());
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
		 * Called every renderstepped when it matches 60FPS
		 */
		Update(): void;
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
		RunService.RenderStepped.Connect(dt => {
			FrameTime += dt;
			if (FrameTime < 1 / 60) return;
			FrameTime = 0;
			component.Update();
		});
	})(),
);

Signals.Start.Fire(); // start non-modules
task.wait(1);

const LoadingScreenFadeOut = TweenService.Create(LoadingInterfaceCanvas, new TweenInfo(0.5), { GroupTransparency: 1 });
LoadingScreenFadeOut.Play();
LoadingScreenFadeOut.Completed.Wait();

task.wait(1);
LoadingInterfaceCanvas.Destroy();

// ! Temporary. will be moved over to another script
Signals.Character_SendRespawnRequest.Call();
