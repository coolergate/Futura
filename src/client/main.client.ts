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
const UserInputService = game.GetService('UserInputService');
const ContentProvider = game.GetService('ContentProvider');
const ReplicatedFirst = game.GetService('ReplicatedFirst');
const TweenService = game.GetService('TweenService');
const StarterGui = game.GetService('StarterGui');
const Player = game.GetService('Players').LocalPlayer;

// ^ Wait until the server is ready, should be in normal game
// ^ but there is an issue with studio that the player logs on
// ^ before Players.PlayerAdded is called
do task.wait(1);
while (ReplicatedStorage.GetAttribute('Running') !== true);

//=============================================================================
// Loading screen
//=============================================================================
import { Folders } from 'shared/global_resources';
const LoadingInterface = Folders.Storage.UserInterface.FindFirstChild('Loading') as ScreenGui;
const LoadingInterfaceCanvas = LoadingInterface.FindFirstChildOfClass('CanvasGroup')!;
{
	LoadingInterface.Parent = Player.WaitForChild('PlayerGui');
	LoadingInterface.Enabled = true;
	StarterGui.SetCoreGuiEnabled('All', false);

	let CurrentTween: Tween | undefined;
	const TextGradient = LoadingInterface.FindFirstChild('UIGradient', true) as UIGradient;
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
		} while (Player.WaitForChild('PlayerGui').FindFirstChild('Loading') !== undefined);
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

Folders.Storage.UserInterface.GetChildren().forEach((element) => {
	if (element.IsA('ScreenGui')) {
		element.Enabled = true;
		element.Parent = Player.WaitForChild('PlayerGui');
	}
});

Signals.Start.Fire();
task.wait(1);

const LoadingScreenFadeOut = TweenService.Create(LoadingInterfaceCanvas, new TweenInfo(0.5), { GroupTransparency: 1 });
LoadingScreenFadeOut.Play();
LoadingScreenFadeOut.Completed.Wait();

task.wait(1);
LoadingInterface.Destroy();

// ! Temporary. will be moved over to another script
Signals.Character_SendRespawnRequest.Call();
