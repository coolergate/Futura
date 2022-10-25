import Folders from 'shared/folders';
import Network from 'shared/network';
import Values from './providers/values';
import console_cmds from './providers/cmds';
import { ILogEventEnricher, ILogEventSink, LogLevel } from '@rbxts/log/out/Core';
import Log, { Logger } from '@rbxts/log';
import Signals from './providers/signals';
import { LogConfiguration } from '@rbxts/log/out/Configuration';

const Player = game.GetService('Players').LocalPlayer;
const UserInputService = game.GetService('UserInputService');

const ConsoleScreenGui = Folders.CHudContent.FindFirstChild('Console') as ScreenGui;
const ConsoleWindow = ConsoleScreenGui.FindFirstChild('Window') as Frame;
const ConsoleLogsFrame = ConsoleWindow.FindFirstChild('Logs') as Frame;
const ConsoleLogPrefab = ConsoleLogsFrame.FindFirstChild('Prefab') as TextLabel;
const ConsoleInputBox = ConsoleWindow.FindFirstChild('Input') as TextBox;

const Server_ChatSendMessage = Network.Client.Get('ChatSendMessage');
const Server_SystemMessage = Network.Client.Get('SystemChatMessage');
const Server_SystemConsole = Network.Client.Get('SystemConsoleEvent');
const Server_PlayerChatted = Network.Client.Get('PlayerChatted');
const Server_ConsoleEvent = Network.Client.Get('ClientConsoleEvent');

ConsoleLogPrefab.Visible = false;
ConsoleScreenGui.Enabled = false;
ConsoleScreenGui.Parent = Player.WaitForChild('PlayerGui');

const colors = new Map<LogLevel, Color3>([
	[LogLevel.Information, Color3.fromRGB(255, 255, 255)],
	[LogLevel.Warning, Color3.fromRGB(255, 255, 127)],
	[LogLevel.Error, Color3.fromRGB(218, 20, 41)],
	[LogLevel.Fatal, Color3.fromRGB(218, 20, 41)],
	[LogLevel.Debugging, Color3.fromRGB(148, 190, 15)],
	[LogLevel.Verbose, Color3.fromRGB(85, 85, 127)],
]);

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

const custom_commands = new Map<string, Callback>();

function SyntaxHighlight(message: string) {
	const split = message.split(' ');
}

const RenderLogOnConsole: ILogEventSink = {
	Emit(message) {
		const level = message.Level;
		const source = message.SourceContext;
		const time = message.Timestamp;
		const content = message.Template;
		const new_log_message = ConsoleLogPrefab.Clone();

		let next_index = 1;
		ConsoleLogsFrame.GetChildren().forEach((inst) => {
			if (inst.IsA('TextLabel') && inst !== ConsoleLogPrefab) {
				if (inst.LayoutOrder > next_index) next_index = inst.LayoutOrder;
			}
		});

		new_log_message.Visible = true;
		new_log_message.Parent = ConsoleLogsFrame;
		new_log_message.LayoutOrder = next_index + 1;
		new_log_message.Name = '';

		const message_color = colors.get(level)!;
		new_log_message.Text = content;
		new_log_message.TextColor3 = message_color;
	},
};

Log.SetLogger(Logger.configure().WriteTo(RenderLogOnConsole).Create());

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

function HandleCommand(content: string) {
	const isCommand = content.sub(1, 1) === '/';

	if (!isCommand) {
		Server_ChatSendMessage.SendToServer(content);
		Log.Info(Player.DisplayName + ': ' + content);
		return;
	}

	const split = content.sub(2, content.size()).split(' ');
	const command = split[0]; // param (ex cg_fov)
	let value = tostring(split[1]) as string | number | undefined; // value (ex 80)

	const local_custom_command = custom_commands.get(command);
	const modular_value = console_cmds.get(command);

	Log.Info(`> ${command} ${value}`);

	if (local_custom_command !== undefined) {
		local_custom_command(value);
		return;
	}

	if (modular_value !== undefined) {
		const value_type = type(value);
		const value_required = type(modular_value);
		let check_success = false;
		if (value_type !== value_required) {
			if (value_required === 'number') {
				const attempt = tonumber(value);
				if (attempt !== undefined) {
					value = attempt;
					check_success = true;
				}
			}

			if (!check_success) {
				Log.Error('Value must be a [' + value_required + ']!');
				return;
			}
		}

		console_cmds.set(command, value);
		//Log.Info(`> ${command} ${value} (${type(value)})`);
		return;
	}

	const response = Server_ConsoleEvent.CallServer(command, [value as string]);
	if (response !== undefined) Log.Verbose(response);
	return;
}

Signals.SendConsoleCommand.Connect(HandleCommand);

ConsoleInputBox.FocusLost.Connect((enterPressed) => {
	if (!enterPressed || ConsoleInputBox.Text === '') return;
	const content = ConsoleInputBox.Text;

	HandleCommand(content);
	ConsoleInputBox.Text = '';
});

Server_SystemConsole.Connect((msg) => Log.Info(`server: ${msg}`));
