//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose:

import { Folders, Remotes } from 'shared/global_resources';
import Signals from './providers/signals';

const ReplicatedStorage = game.GetService('ReplicatedStorage');
const UserInputService = game.GetService('UserInputService');
const ContentProvider = game.GetService('ContentProvider');
const ReplicatedFirst = game.GetService('ReplicatedFirst');
const StarterGui = game.GetService('StarterGui');
const Player = game.GetService('Players').LocalPlayer;

do task.wait(1);
while (ReplicatedStorage.GetAttribute('Ready') !== true);

const LoadingInterface = Folders.Storage.UserInterface.FindFirstChild('Loading') as ScreenGui;
LoadingInterface.Parent = Player.WaitForChild('PlayerGui');
StarterGui.SetCoreGuiEnabled('All', false);

task.wait(2);
ContentProvider.PreloadAsync(ReplicatedStorage.GetDescendants());
Remotes.Client.Get('PlayerLogin').CallServer();

Folders.Storage.UserInterface.GetChildren().forEach((element) => {
	if (element.IsA('ScreenGui')) {
		element.Enabled = true;
		element.Parent = Player.WaitForChild('PlayerGui');
	}
});

Signals.Start.Fire();
LoadingInterface.Destroy();
task.wait(1);
Signals.CharacterRequestRespawn.Invoke();
