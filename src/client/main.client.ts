//========= Copyright GGC Studios, All rights reserved. ============//
// Purpose: Initialize player's client and console					//
//==================================================================//

import console_cmds from './providers/cmds';
import Signals from './providers/signals';
import Values from './providers/values';
import { Folders, Remotes } from 'shared/global_resources';
import placeinfo from 'shared/components/placeinfo';

const ReplicatedStorage = game.GetService('ReplicatedStorage');
const UserInputService = game.GetService('UserInputService');
const ContentProvider = game.GetService('ContentProvider');
const ReplicatedFirst = game.GetService('ReplicatedFirst');
const StarterGui = game.GetService('StarterGui');
const Player = game.GetService('Players').LocalPlayer;

do task.wait(1);
while (ReplicatedStorage.GetAttribute('Ready') !== true);

const Server_ChatSendMessage = Remotes.Client.Get('ChatSendMessage');
const Server_SystemMessage = Remotes.Client.Get('SystemChatMessage');
const Server_SystemConsole = Remotes.Client.Get('SystemConsoleEvent');
const Server_PlayerChatted = Remotes.Client.Get('PlayerChatted');
const Server_ConsoleEvent = Remotes.Client.Get('ClientConsoleEvent');
const Server_PlayerLogin = Remotes.Client.Get('PlayerLogin');

const Local_StartSignal = Signals.Start;
const Local_RequestRespawn = Signals.CharacterRequestRespawn;
const Local_RenderToConsole = Signals.RenderToConsole;

// CONSOLE SECTION START \\
const ConsoleScreenGui = Folders.Storage.UserInterface.FindFirstChild('Console') as ScreenGui;
const ConsoleWindow = ConsoleScreenGui.FindFirstChild('Window') as Frame;
const ConsoleContent = ConsoleWindow.FindFirstChild('Content') as Frame;
const ConsoleLogPrefab = ConsoleContent.FindFirstChild('LogPrefab') as TextLabel;

const ConsoleInputFrame = ConsoleContent.FindFirstChild('InputFrame') as Frame;
const ConsoleInputUsername = ConsoleInputFrame.FindFirstChildOfClass('TextLabel')!;
const ConsoleInputBox = ConsoleInputFrame.FindFirstChildOfClass('TextBox')!;

ConsoleLogPrefab.Visible = false;
ConsoleScreenGui.Enabled = false;
ConsoleScreenGui.Parent = Player.WaitForChild('PlayerGui');

ConsoleInputUsername.Text = `${Player.Name}@${placeinfo.name}$ `;
ConsoleInputBox.Size = new UDim2(1, -ConsoleInputUsername.AbsoluteSize.X, 0, 0);

const custom_commands = new Map<string, Callback>();
const custom_colors = new Map<string, Color3>([
	['^0', new Color3(0, 0, 0)],
	['^1', new Color3(1, 0, 0)],
	['^2', new Color3(0, 1, 0)],
	['^3', new Color3(1, 1, 0)],
	['^4', new Color3(0, 0, 1)],
	['^5', new Color3(0, 1, 1)],
	['^6', new Color3(1, 0, 1)],
	['^7', new Color3(1, 1, 1)],
]);
function getnextindex(): number {
	let av_index = 1;
	ConsoleContent.GetChildren().forEach((inst) => {
		if (inst !== ConsoleLogPrefab && inst !== ConsoleInputFrame && (inst.IsA('TextLabel') || inst.IsA('Frame'))) {
			if (inst.LayoutOrder >= av_index) av_index = inst.LayoutOrder + 1;
		}
	});
	return av_index;
}
function render(LogType: ConsoleLogType | 'userinput', content: string) {
	let start_params = '';
	let end_params = '';
	let cmd_chat = false;
	switch (LogType) {
		case 'Info': {
			start_params = '<font color="rgb(170,170,170)">';
			end_params = '</font>';
			break;
		}
		case 'Error': {
			start_params = '<font color="rgb(255,170,170)"><i>';
			end_params = '</i></font>';
			break;
		}
		case 'Warn': {
			start_params = '<font color="rgb(255,255,180)"><i>';
			end_params = '</i></font>';
			break;
		}
		case 'Chat': {
			start_params = '(chat) ';
			end_params = '';
			cmd_chat = true;
			break;
		}
		case 'Success': {
			start_params = '<font color="rgb(170, 255, 170)"><i>';
			end_params = '</i></font>';
			cmd_chat = true;
			break;
		}
		case 'userinput': {
			start_params =
				'<font color="rgb(255, 170, 127)">' +
				ConsoleInputUsername.Text +
				'</font><font color="rgb(255,255,255)">';
			end_params = '</font>';
		}
	}

	const prefab = ConsoleLogPrefab.Clone();
	prefab.Visible = true;
	prefab.Parent = ConsoleContent;
	prefab.LayoutOrder = getnextindex();
	prefab.Name = '';
	prefab.Text = `${start_params}${content}${end_params}`;
}

function HandleCommand(content: string) {
	const split = content.split(' ');
	const command = split[0];
	const value = tostring(split[1]);

	// check to see if it is an value that can be changed
	if (console_cmds.has(command)) {
		const scr_value = console_cmds.get(command);
		const scr_type = type(scr_value);
		const scr_given = type(value);
		let cValue = value as string | number;
		let check_success = false;

		if (value === 'nil') {
			// client wants the value stored in such cmdval
			render('Info', `"${command}" is:"${scr_value}" type:"${scr_type}"`);
			return;
		}

		if (scr_type !== scr_given) {
			if (scr_type === 'number') {
				const attempt = tonumber(value);
				if (attempt !== undefined) {
					cValue = attempt;
					check_success = true;
				}
			}

			if (!check_success) {
				render('Error', `Wrong value type! requires:"${scr_type}", got:"${scr_given}"`);
				return;
			}
		}

		console_cmds.set(command, cValue);
		return;
	}

	// else check if it is an callable function
	if (custom_commands.has(command)) {
		const arg = content.sub(command.size() + 2, content.size());
		custom_commands.get(command)!(arg);
		return;
	}

	const response = Server_ConsoleEvent.CallServer(command, [value as string]);
	if (response !== undefined) {
		render('Info', '[Server] ' + response);
		return;
	}

	render('Error', 'Unknown or restricted command');
}

declare global {
	type ConsoleLogType = 'Info' | 'Error' | 'Warn' | 'Success' | 'Chat';
}

custom_commands.set('clear', function () {
	ConsoleContent.GetChildren().forEach((inst) => {
		if ((inst.IsA('TextLabel') || inst.IsA('Frame')) && inst !== ConsoleInputFrame && inst !== ConsoleLogPrefab)
			inst.Destroy();
	});
});
custom_commands.set('say', function (content: string) {
	Server_ChatSendMessage.SendToServer(content);
	render('Chat', `${Player.DisplayName}: ${content}`);
});
custom_commands.set('echo', function (content: string) {
	render('Info', content);
});
custom_commands.set('close', function (content: string) {
	ConsoleScreenGui.Enabled = false;
});
custom_commands.set('exit', function (content: string) {
	ConsoleScreenGui.Enabled = false;
});
custom_commands.set('version', function (content: string) {
	render('Info', `Game: "${placeinfo.name}" ver. ${placeinfo.version}`);
});

UserInputService.InputBegan.Connect((input, unavaiable) => {
	if (
		input.KeyCode === Enum.KeyCode.RightShift ||
		input.KeyCode === Enum.KeyCode.Insert ||
		input.KeyCode === Enum.KeyCode.F2
	) {
		ConsoleScreenGui.Enabled = !ConsoleScreenGui.Enabled;
	}
});

ConsoleScreenGui.GetPropertyChangedSignal('Enabled').Connect(() => {
	if (ConsoleScreenGui.Enabled) {
		ConsoleInputBox.TextEditable = true;
		ConsoleInputBox.CaptureFocus();
		Values.CCameraUnlock.set('Console', true);
	} else {
		ConsoleInputBox.ReleaseFocus();
		ConsoleInputBox.TextEditable = false;
		Values.CCameraUnlock.delete('Console');
	}
});

ConsoleInputBox.FocusLost.Connect((enterPressed) => {
	ConsoleInputBox.TextEditable = false;
	const content = ConsoleInputBox.Text;
	if (enterPressed) {
		render('userinput', content);
		HandleCommand(content);
	}

	ConsoleInputBox.TextEditable = true;
	if (enterPressed) {
		task.wait();
		ConsoleInputBox.CaptureFocus();
		task.wait();
		ConsoleInputBox.Text = '';
	}
});

Signals.SendConsoleCommand.Connect(HandleCommand);
Local_RenderToConsole.Connect((log, msg) => render(log, msg));

// CONSOLE SECTION END \\
const LoadingScreen = Folders.Storage.UserInterface.WaitForChild('Loading') as ScreenGui;
const LoadingScreenFrame = LoadingScreen.FindFirstChildOfClass('Frame')!;
const LoadingScreenLogPrefab = LoadingScreenFrame.FindFirstChild('Prefab') as TextLabel;

LoadingScreen.Enabled = true;
LoadingScreenLogPrefab.Visible = false;
LoadingScreen.Parent = Player.WaitForChild('PlayerGui');

function LoadingScreenRenderLog(content: string) {
	const clone = LoadingScreenLogPrefab.Clone();
	clone.Parent = LoadingScreenFrame;
	clone.Name = 'LoadingLog';
	clone.Text = content;
	clone.Visible = true;
}

const AssetTypeBlacklist = new Map<string, boolean>([
	['Folder', true],
	['Script', true],
	['LocalScript', true],
	['ModuleScript', true],
	['BoolValue', true],
	['NumberValue', true],
	['StringValue', true],
	['Configuration', true],
	['ScreenGui', true],
	['TextBox', true],
	['TextLabel', true],
	['TextButton', true],
	['CanvasGroup', true],
	['Frame', true],
	['ScrollingFrame', true],
	['UIScale', true],
	['UIGradient', true],
	['UIStroke', true],
	['UIPadding', true],
	['UIListLayout', true],
	['UIAspectRatioConstraint', true],
	['RemoteEvent', true],
	['RemoteFunction', true],
	['BindableEvent', true],
	['BindableFunction', true],
	['Model', true],
	['Weld', true],
	['Part', true],
	['ParticleEmitter', true],
	['Motor6D', true],
	['Attachment', true],
]);

ReplicatedFirst.RemoveDefaultLoadingScreen();
StarterGui.SetCoreGuiEnabled('All', false);

task.wait(3);

// Actual preloading
LoadingScreenRenderLog('Downloading game asset list...');
render('Info', 'Downloading game asset list...');
task.wait(2);

render('Info', 'Pre-Loading game assets...');
const content = ReplicatedStorage.GetDescendants();
const newcontent: Instance[] = [];
const start_time = os.time();
content.forEach((inst, index) => {
	if (!AssetTypeBlacklist.has(inst.ClassName)) newcontent.insert(0, inst);
});
newcontent.sort((a, b) => {
	return a.ClassName > b.ClassName;
});

newcontent.forEach((inst, index) => {
	ContentProvider.PreloadAsync(content);
	LoadingScreenRenderLog(`Pre-Loaded object: ${inst.ClassName} (${index + 1}/${newcontent.size()})`);
});
const duration = os.difftime(os.time(), start_time);
render('Success', `Game assets loaded. Took: <font color="rgb(85,255,0)">${math.round(duration)} seconds</font>`);
LoadingScreenRenderLog(`Finished Pre-Loading assets!`);

render('Info', 'Reading interface list...');
LoadingScreenRenderLog(`Downloading interfaces...`);
Folders.Storage.UserInterface.GetChildren().forEach((element) => {
	if (element.IsA('ScreenGui')) {
		element.Enabled = true;
		element.Parent = Player.WaitForChild('PlayerGui');
	}
});

render('Info', 'Sending server sync-call (user_login)');
LoadingScreenRenderLog(`Requesting client login...`);
Server_PlayerLogin.CallServer();

Local_StartSignal.Fire();
LoadingScreen.Destroy();
task.wait(1);
Local_RequestRespawn.Invoke();
