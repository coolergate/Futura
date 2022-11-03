import { Folders, Remotes } from 'shared/global_resources';
import Values from './providers/values';
import console_cmds from './providers/cmds';
import Signals from './providers/signals';

const Player = game.GetService('Players').LocalPlayer;
const UserInputService = game.GetService('UserInputService');

const ConsoleScreenGui = Folders.Storage.UserInterface.FindFirstChild('Console') as ScreenGui;
const ConsoleWindow = ConsoleScreenGui.FindFirstChild('Window') as Frame;
const ConsoleContent = ConsoleWindow.FindFirstChild('Content') as Frame;
const ConsoleLogPrefab = ConsoleContent.FindFirstChild('LogPrefab') as TextLabel;
const ConsoleInputBox = ConsoleContent.FindFirstChild('Input') as TextBox;

const Server_ChatSendMessage = Remotes.Client.Get('ChatSendMessage');
const Server_SystemMessage = Remotes.Client.Get('SystemChatMessage');
const Server_SystemConsole = Remotes.Client.Get('SystemConsoleEvent');
const Server_PlayerChatted = Remotes.Client.Get('PlayerChatted');
const Server_ConsoleEvent = Remotes.Client.Get('ClientConsoleEvent');

const Client_RenderToConsole = Signals.RenderToConsole;

declare global {
	type ConsoleLogType = 'Info' | 'Error' | 'Warn' | 'Verbose' | 'Chat';
}

ConsoleLogPrefab.Visible = false;
ConsoleScreenGui.Enabled = false;
ConsoleScreenGui.Parent = Player.WaitForChild('PlayerGui');

const custom_colors = new Map<string, Color3>([
	['^0', new Color3()],
	['^1', new Color3(1, 0, 0)],
	['^2', new Color3(0, 1, 0)],
	['^3', new Color3(1, 1, 0)],
	['^4', new Color3(0, 0, 1)],
	['^5', new Color3(0, 1, 1)],
	['^6', new Color3(1, 0, 1)],
	['^7', new Color3(1, 1, 1)],
]);

const custom_commands = new Map<string, Callback>([
	[
		'clear',
		function () {
			ConsoleContent.GetChildren().forEach((inst) => {
				if (inst.IsA('TextLabel') && inst !== ConsoleLogPrefab) inst.Destroy();
			});
		},
	],
	[
		'say',
		function (content: string) {
			Server_ChatSendMessage.SendToServer(content);
			render('Chat', `${Player.DisplayName}: ${content}`);
		},
	],
]);

function render(LogType: ConsoleLogType, content: string) {
	let start_params = '<font color="rgb(255,255,255)">';
	let end_params = '</font>';
	let cmd_chat = false;
	switch (LogType) {
		case 'Info': {
			/* start_params = '<font color="rgb(170,170,170)">/';
			end_params = '</font>'; */
			break;
		}
		case 'Error': {
			start_params = '<font color="rgb(255,0,0)"><i>';
			end_params = '</i></font>';
			break;
		}
		case 'Warn': {
			start_params = '<font color="rgb(255,255,0)"><i>';
			end_params = '</i></font>';
			break;
		}
		case 'Verbose': {
			start_params = '<font color="rgb(85,85,127)">@<i>';
			end_params = '</i></font>';
			break;
		}
		case 'Chat': {
			start_params = '[chat] ';
			end_params = '';
			cmd_chat = true;
			break;
		}
	}

	if (cmd_chat) {
		// TODO
	}

	const prefab = ConsoleLogPrefab.Clone();

	let av_index = 1;
	ConsoleContent.GetChildren().forEach((inst) => {
		if (inst.IsA('TextLabel') && inst !== ConsoleLogPrefab) {
			if (inst.LayoutOrder >= av_index) av_index = inst.LayoutOrder + 1;
		}
	});

	prefab.Visible = true;
	prefab.Parent = ConsoleContent;
	prefab.LayoutOrder = av_index;
	prefab.Name = '';
	prefab.Text = `${start_params}${content}${end_params}`;
}

UserInputService.InputBegan.Connect((input, unavaiable) => {
	if (!unavaiable && (input.KeyCode === Enum.KeyCode.RightShift || input.KeyCode === Enum.KeyCode.Insert)) {
		ConsoleScreenGui.Enabled = !ConsoleScreenGui.Enabled;
	}
});

ConsoleScreenGui.GetPropertyChangedSignal('Enabled').Connect(() => {
	if (ConsoleScreenGui.Enabled) {
		ConsoleInputBox.CaptureFocus(); // Focus when it becomes visible
		Values.CCameraUnlock.set('Console', true);
	} else {
		ConsoleInputBox.ReleaseFocus(); // Unfocus when it hides
		Values.CCameraUnlock.delete('Console');
	}
});

ConsoleInputBox.FocusLost.Connect((enterPressed) => {
	if (!enterPressed || ConsoleInputBox.Text === '') return;
	const content = ConsoleInputBox.Text;
	const command = content.sub(1, 1) === '/';

	if (command) {
		render('Info', content);
		HandleCommand(content);
	} else {
		render('Info', '/say ' + content);
		HandleCommand('/say ' + content);
	}
	ConsoleInputBox.Text = '';
});

function HandleCommand(content: string) {
	const split = content.sub(2, content.size()).split(' ');
	const command = split[0]; // param (ex cg_fov)
	const value = tostring(split[1]); // value (ex 80)

	// check to see if it is an value that can be changed
	if (console_cmds.has(command)) {
		const scr_value = console_cmds.get(command);
		const scr_type = type(scr_value);
		const scr_given = type(value);
		let cValue = value as string | number;
		let check_success = false;

		if (value === 'nil') {
			// client wants the value stored in such cmdval
			render('Info', `${command} value is ${scr_value} [${scr_type}]`);
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
				render('Error', `Wrong value type! given: ${scr_type}, got: ${scr_given}`);
				return;
			}
		}

		console_cmds.set(command, cValue);
		return;
	}

	// else check if it is an callable function
	if (custom_commands.has(command)) {
		const arg = content.sub(command.size() + 3, content.size());
		custom_commands.get(command)!(arg);
		return;
	}

	const response = Server_ConsoleEvent.CallServer(command, [value as string]);
	if (response !== undefined) {
		render('Verbose', 'Server: ' + response);
		return;
	}

	render('Error', 'Unknown or restricted command');
}

Signals.SendConsoleCommand.Connect(HandleCommand);
Client_RenderToConsole.Connect((log, msg) => render(log, msg));
