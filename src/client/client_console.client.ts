import Folders from 'shared/folders';
import Network from 'shared/network';
import Values from './providers/values';
import console_cmds from './providers/cmds';
import { ILogEventEnricher, ILogEventSink, LogLevel } from '@rbxts/log/out/Core';
import Log, { Logger } from '@rbxts/log';

const Player = game.GetService('Players').LocalPlayer;
const UserInputService = game.GetService('UserInputService');

const ConsoleScreenGui = Folders.CHudContent.FindFirstChild('Console') as ScreenGui;
const ConsoleWindow = ConsoleScreenGui.FindFirstChild('Window') as Frame;
const ConsoleLogsFrame = ConsoleWindow.FindFirstChild('Logs') as Frame;
const ConsoleLogPrefab = ConsoleLogsFrame.FindFirstChild('LogPrefab') as Frame;
const ConsoleInputBox = ConsoleWindow.FindFirstChild('Input') as TextBox;
const ConsoleCloseButton = ConsoleWindow.FindFirstChild('Close') as TextButton;

const Server_ChatSendMessage = Network.Client.Get('ChatSendMessage');
const Server_SystemMessage = Network.Client.Get('SystemChatMessage');
const Server_PlayerChatted = Network.Client.Get('PlayerChatted');
const Server_SendCommand = Network.Client.Get('SendCommand');

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

const RenderLogOnConsole: ILogEventSink = {
	Emit(message) {
		const level = message.Level;
		const source = message.SourceContext;
		const time = message.Timestamp;
		const content = message.Template;
		const new_log_message = ConsoleLogPrefab.Clone();
		const log_message_content = new_log_message.FindFirstChild('MessageContent') as TextLabel;

		let next_index = 1;
		ConsoleLogsFrame.GetChildren().forEach((inst) => {
			if (inst.IsA('Frame') && inst !== ConsoleLogPrefab) {
				if (inst.LayoutOrder > next_index) next_index = inst.LayoutOrder;
			}
		});

		new_log_message.Visible = true;
		new_log_message.Parent = ConsoleLogsFrame;
		new_log_message.LayoutOrder = next_index + 1;
		new_log_message.Name = '';

		const message_color = colors.get(level)!;
		log_message_content.Text = content;
		log_message_content.TextColor3 = message_color;
	},
};

Log.SetLogger(Logger.configure().WriteTo(RenderLogOnConsole).Create());

UserInputService.InputBegan.Connect((input, unavaiable) => {
	if (!unavaiable && (input.KeyCode === Enum.KeyCode.RightShift || input.KeyCode === Enum.KeyCode.Insert)) {
		ConsoleScreenGui.Enabled = !ConsoleScreenGui.Enabled;
	}
});

ConsoleCloseButton.MouseButton1Click.Connect(() => (ConsoleScreenGui.Enabled = false));
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
	if (!enterPressed) return;
	const content = ConsoleInputBox.Text;
	const isCommand = content.sub(1, 1) === '/';
	const isServerCommand = content.sub(1, 2) === '//';

	if (isServerCommand) {
		const split = content.sub(3, content.size()).split(' ');
		const param1 = split[0];
		const param2 = split[1];
		const param3 = split[3];
		Server_SendCommand.SendToServer(param1, param2, param3);
		return;
	}

	if (isCommand) {
		Log.Info(content);

		const split = content.sub(2, content.size()).split(' ');
		const param1 = split[0]; // param (ex cg_fov)
		let param2 = split[1] as string | number | undefined; // value (ex 80)

		const equivalent_param = console_cmds.get(param1);
		if (equivalent_param === undefined) {
			Log.Error(`${param1} is not a valid parameter`);
			return;
		}

		if (param2 === undefined) {
			Log.Info(`${param1} -> ${equivalent_param} (${type(equivalent_param)})`);
			return;
		}

		const param_value_type = type(equivalent_param);
		if (param_value_type === 'number') {
			const tonumber_param2 = tonumber(param2);
			if (tonumber_param2 === undefined) {
				Log.Error(`${param1} value must be a number!`);
				return;
			}
			param2 = tonumber_param2;
		}

		console_cmds.set(param1, param2);
	} else {
		Server_ChatSendMessage.SendToServer(content);
		Log.Info(`${Player.DisplayName}: ${content}`);
	}
});
