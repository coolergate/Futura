// Downstreets main menu & console
// coolergate#2031

task.wait(3);

import { KnitClient as Knit } from '@rbxts/knit';
import console_cmds from './providers/cmds';
import Signals from './providers/signals';
import Values from './providers/values';
import Network from 'shared/network';
import Folders from 'shared/folders';

const Player = game.GetService('Players').LocalPlayer;
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const RunService = game.GetService('RunService');
const ContentProvider = game.GetService('ContentProvider');
const StarterGui = game.GetService('StarterGui');
const ReplicatedFirst = game.GetService('ReplicatedFirst');
const ScriptContext = game.GetService('ScriptContext');

ScriptContext.Error.Connect((message, trace, container) => {
	const source = container as Script | LocalScript;
	if (!container) return;
	if (RunService.IsStudio()) source.Disabled = true;
});

do task.wait();
while (ReplicatedStorage.GetAttribute('Ready') !== true);

const Server_PlayerLogin = Network.Client.Get('PlayerLogin');
const Server_RespawnRequest = Network.Client.Get('RequestRespawn');

const Local_StartSignal = Signals.Start;
const Local_RequestRespawn = Signals.CharacterRequestRespawn;

ReplicatedFirst.RemoveDefaultLoadingScreen();
StarterGui.SetCoreGuiEnabled('All', false);

// Actual preloading
const content = ReplicatedStorage.GetDescendants();
if (!RunService.IsStudio()) {
	Signals.RenderToConsole.Fire('ClientVerbose', 'Pre-loading game assets');
	const start_time = os.time();
	ContentProvider.PreloadAsync(content);
	const duration = os.difftime(os.time(), start_time);
	Signals.RenderToConsole.Fire(
		'ClientVerbose',
		`Game assets loaded. Took: <font color="rgb(85,255,0)">${math.floor(duration)} seconds</font>`,
	);
} else {
	Signals.RenderToConsole.Fire('ClientVerbose', 'Skipped game assets download. (User is in studio mode)');
}

Signals.RenderToConsole.Fire('ClientVerbose', 'Reading interface list...');
Folders.CHudContent.GetChildren().forEach((element) => {
	if (element.IsA('ScreenGui')) {
		element.Enabled = true;
		element.Parent = Player.WaitForChild('PlayerGui');
	}
});

Signals.RenderToConsole.Fire('ClientVerbose', 'Sending server login request.');
Server_PlayerLogin.CallServer();

Local_StartSignal.Fire();
task.wait(1);
Local_RequestRespawn.Invoke();
