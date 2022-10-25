import Folders from 'shared/folders';
import Network from 'shared/network';
import Values from './providers/values';
import console_cmds from './providers/cmds';
import Signals from './providers/signals';

const Player = game.GetService('Players').LocalPlayer;
const UserInputService = game.GetService('UserInputService');

const ConsoleScreenGui = Folders.CHudContent.FindFirstChild('Console') as ScreenGui;
const ConsoleWindow = ConsoleScreenGui.FindFirstChild('Window') as Frame;
const ConsoleContent = ConsoleWindow.FindFirstChild('Content') as Frame;
const ConsoleLogPrefab = ConsoleContent.FindFirstChild('LogPrefab') as TextLabel;
const ConsoleInputBox = ConsoleContent.FindFirstChild('Input') as TextBox;

const Server_ChatSendMessage = Network.Client.Get('ChatSendMessage');
const Server_SystemMessage = Network.Client.Get('SystemChatMessage');
const Server_SystemConsole = Network.Client.Get('SystemConsoleEvent');
const Server_PlayerChatted = Network.Client.Get('PlayerChatted');
const Server_ConsoleEvent = Network.Client.Get('ClientConsoleEvent');

const Client_RenderToConsole = Signals.RenderToConsole;

declare global {
	type ConsoleLogType =
		| 'ClientInfo'
		| 'ServerInfo'
		| 'ClientError'
		| 'ServerError'
		| 'ClientVerbose'
		| 'ServerVerbose';
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
			render('ServerInfo', `[chat] ${Player.DisplayName}: ${content}`);
		},
	],
]);

function SyntaxHighlight(message: string) {
	message = message.gsub('\n', '<br />')[0];
	const split = message.split(' ');
}

function render(LogType: ConsoleLogType, Content: string) {
	let first_character = '';
	let message_color = '<font color="rgb(255,255,255)">';
	switch (LogType) {
		case 'ClientInfo': {
			first_character = '<font color="rgb(120,255,255)">$ </font>';
			break;
		}
		case 'ClientError': {
			first_character = '<font color="rgb(255,46,49)">$! </font>';
			message_color = '<font color="rgb(255,120,120)">';
			break;
		}
		case 'ServerInfo': {
			first_character = '<font color="rgb(100,255,100)"># </font>';
			break;
		}
		case 'ServerError': {
			first_character = '<font color="rgb(255,46,49)">#! </font>';
			message_color = '<font color="rgb(255,120,120)">';
			break;
		}
		case 'ClientVerbose': {
			first_character = '<font color="rgb(120,120,120)">$ </font>';
			message_color = '<font color="rgb(120,120,120)">';
			break;
		}
		case 'ServerVerbose': {
			first_character = '<font color="rgb(120,120,120)"># </font>';
			message_color = '<font color="rgb(120,120,120)">';
			break;
		}
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
	prefab.Name = 'консоли';
	prefab.Text = first_character + `${message_color}${Content}</font>`;
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

	HandleCommand(content);
	ConsoleInputBox.Text = '';
});

function HandleCommand(content: string) {
	const cmd_isclient = content.sub(1, 2) === '$ ';
	const cmd_isserver = content.sub(1, 2) === '# ';

	if (!cmd_isclient && !cmd_isserver) {
		custom_commands.get('say')!(content);
		return;
	}

	const split = content.sub(3, content.size()).split(' ');
	const command = split[0]; // param (ex cg_fov)
	let value = tostring(split[1]) as string | number | undefined; // value (ex 80)

	if (cmd_isserver) {
		render('ServerInfo', `${command} ${value}`);
		let Answer = '<i>No aswer from server</i>';
		const response = Server_ConsoleEvent.CallServer(command, [value as string]);
		if (response !== undefined) Answer = response;
		render('ServerVerbose', Answer);
		return;
	}

	if (cmd_isclient) {
		const scr_value = console_cmds.get(command);
		const scr_callback = custom_commands.get(command);

		if (scr_value !== undefined) {
			const scr_type = type(scr_value);
			const scr_given = type(value);
			let check_success = false;

			if (value === 'nil') {
				// client wants the value stored in such cmdval
				render('ClientVerbose', `${command} = ${scr_value} [${scr_type}]`);
				return;
			}

			if (scr_type !== scr_given) {
				if (scr_type === 'number') {
					const attempt = tonumber(value);
					if (attempt !== undefined) {
						value = attempt;
						check_success = true;
					}
				}

				if (!check_success) {
					render('ClientError', `Given value must be a ${scr_type}, got ${scr_given}`);
					return;
				}
			}

			console_cmds.set(command, value);
			render('ClientInfo', `${command} -> ${value}`);
			return;
		}

		if (scr_callback !== undefined) {
			scr_callback(value);
			return;
		}

		render('ClientInfo', `${command} ${value}`);
	}
}

Signals.SendConsoleCommand.Connect(HandleCommand);
Client_RenderToConsole.Connect((log, msg) => render(log, msg));
