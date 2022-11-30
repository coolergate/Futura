//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Client's console

import Signals from './providers/signals';
import { ConVar, CreatedVars } from 'shared/components/vars';
import { Folders } from 'shared/global_resources';
import placeinfo from 'shared/components/placeinfo';
import Values from 'client/providers/values';
import Network from 'shared/network';

const ReplicatedStorage = game.GetService('ReplicatedStorage');
const UserInputService = game.GetService('UserInputService');
const ContentProvider = game.GetService('ContentProvider');
const ReplicatedFirst = game.GetService('ReplicatedFirst');
const StarterGui = game.GetService('StarterGui');
const Player = game.GetService('Players').LocalPlayer;

const net_ConsoleArg = Network.Console_SendArg;
const net_GetCommands = Network.Console_GetServerArgs;
const Local_RenderToConsole = Signals.RenderToConsole;

//=============================================================================
// Server & Client cmd list
//=============================================================================
const ClientCommands = new Map<string, Callback>();
const ServerCommands = new Array<string>();

function update_server_commands() {
	net_GetCommands.InvokeServer().andThen((list) => {
		list.forEach((str) => {
			if (!ServerCommands.includes(str)) ServerCommands.insert(0, str);
		});
		ServerCommands.forEach((str, index) => {
			if (!list.includes(str)) ServerCommands.remove(index);
		});
	});
}
update_server_commands();

//=============================================================================
// Rendering messages
//=============================================================================
interface ConsoleMessageInfo {
	content: string;
	mode: ConsoleMessageType;
	time: string;
}
declare global {
	type ConsoleMessageType = 'Info' | 'Error' | 'Warn' | 'UserInput' | 'Chat';
}

const LoggedMessages = new Array<TextLabel>();
const MessageQueue = new Array<ConsoleMessageInfo>();
const custom_colors = new Map<number, Color3>([
	[0, new Color3(0, 0, 0)], // black (cannot be used in names)
	[1, new Color3(1, 0, 0)], // red
	[2, new Color3(0, 1, 0)], // green
	[3, new Color3(1, 1, 0)], // yellow
	[4, new Color3(0, 0, 1)], // blue
	[5, new Color3(0, 1, 1)], // cyan
	[6, new Color3(1, 0, 1)], // magenta
	[7, new Color3(1, 1, 1)], // white (default)
]);

function RenderMessage(Mode: ConsoleMessageType, Content: string) {
	const CustomColorSplit = Content.split('^');
	let FinalMessage = '';
	let Color: Color3;
	switch (Mode) {
		case 'Error': {
			Color = Color3.fromRGB(255, 170, 170);
			break;
		}
		case 'Warn': {
			Color = Color3.fromRGB(255, 255, 180);
			break;
		}
		case 'Chat': {
			FinalMessage = '[chat] ';
			break;
		}
		case 'UserInput': {
			FinalMessage = `<font color="#${ConsoleInputUsername.TextColor3.ToHex()}">${
				ConsoleInputUsername.Text
			}</font>`;
			break;
		}
		default:
			Color = Color3.fromRGB(255, 255, 180);
	}

	if (CustomColorSplit.size() > 0)
		CustomColorSplit.forEach((str) => {
			const to_number = tonumber(str.sub(1, 1));
			if (to_number === undefined) FinalMessage = FinalMessage + str;
			else {
				const equivalent_color = custom_colors.get(to_number);
				if (equivalent_color === undefined) FinalMessage = FinalMessage + str.sub(2, str.size());
				else {
					const sub = str.sub(2, str.size());
					FinalMessage = FinalMessage + `<font color="#${equivalent_color.ToHex()}">${sub}</font>`;
				}
			}
		});
	else FinalMessage = Content;

	const prefab = ConsoleLogPrefab.Clone();
	prefab.Visible = true;
	prefab.Parent = ConsoleContent;
	prefab.LayoutOrder = getnextindex();
	prefab.Name = '';
	prefab.Text = FinalMessage;

	LoggedMessages.insert(0, prefab);

	ConsoleContent.CanvasPosition = new Vector2(0, 1e23);
}

//=============================================================================
// Interface
//=============================================================================
const ConsoleWindow = Player.WaitForChild('PlayerGui').WaitForChild('Main').FindFirstChild('ConsoleWindow') as Frame;
const ConsoleContent = ConsoleWindow.FindFirstChild('Content') as ScrollingFrame;
const ConsoleLogPrefab = ConsoleContent.FindFirstChild('LogPrefab') as TextLabel;

const ConsoleInputFrame = ConsoleWindow.FindFirstChild('InputFrame') as Frame;
const ConsoleInputUsername = ConsoleInputFrame.FindFirstChildOfClass('TextLabel')!;
const ConsoleInputBox = ConsoleInputFrame.FindFirstChildOfClass('TextBox')!;

ConsoleLogPrefab.Visible = false;
ConsoleWindow.Visible = false;

function getnextindex(): number {
	let av_index = 1;
	ConsoleContent.GetChildren().forEach((inst) => {
		if (inst !== ConsoleLogPrefab && inst !== ConsoleInputFrame && (inst.IsA('TextLabel') || inst.IsA('Frame'))) {
			if (inst.LayoutOrder >= av_index) av_index = inst.LayoutOrder + 1;
		}
	});
	return av_index;
}

function Handle(content: string) {
	const args = content.split(' ');
	const command = tostring(args[0]);
	args.remove(0);

	const equivalent_ConVar = CreatedVars.find((val, index, obj) => {
		return val.name === command;
	});
	if (equivalent_ConVar && !equivalent_ConVar.attributes.has('Hidden')) {
		if (args[0] === undefined) {
			let description = equivalent_ConVar.description;
			let attributes = '';

			equivalent_ConVar.attributes.forEach((_, key) => {
				attributes = attributes + key + ', ';
			});
			if (description === '') description = 'None';

			RenderMessage(
				'Info',
				`${equivalent_ConVar.name} is:"${equivalent_ConVar.value}", default:"${equivalent_ConVar.original_value}"`,
			);
			RenderMessage('Info', `Attributes: ${attributes}`);
			RenderMessage('Info', `Desc: ${equivalent_ConVar.description}`);
			return;
		}

		if (equivalent_ConVar.attributes.has('Readonly')) {
			RenderMessage('Error', 'Variable is read-only.');
			return;
		}

		switch (equivalent_ConVar.value_type) {
			case 'number': {
				const attempt = tonumber(args[0]);
				if (attempt === undefined) {
					RenderMessage('Error', `Value must be a "${equivalent_ConVar.value_type}", got "string" !`);
					return;
				}
				equivalent_ConVar.value = attempt;
				break;
			}
			case 'function': {
				const func = equivalent_ConVar.value as Callback;
				func(args);
				break;
			}
			default: {
				RenderMessage('Error', `Variable has unknown value type. "${equivalent_ConVar.value_type}"`);
			}
		}

		return;
	}

	// else check if it is an callable function
	if (ClientCommands.has(command)) {
		const arg = content.sub(command.size() + 2, content.size());
		ClientCommands.get(command)!(arg);
		return;
	}

	// check if it's an server command
	if (ServerCommands.includes(command)) {
		const [server_recieved, response] = net_ConsoleArg.InvokeServer(command, [args[0] as string]).await();
		if (response !== undefined) {
			RenderMessage('Info', tostring(response));
			return;
		}
	}

	RenderMessage('Error', 'Unknown or restricted command');
}

ClientCommands.set('clear', function () {
	ConsoleContent.GetChildren().forEach((inst) => {
		if ((inst.IsA('TextLabel') || inst.IsA('Frame')) && inst !== ConsoleInputFrame && inst !== ConsoleLogPrefab)
			inst.Destroy();
	});
});
ClientCommands.set('say', function (content: string) {
	net_ConsoleArg.InvokeServer('say', [content]);
	RenderMessage('Chat', `${Player.DisplayName}: ${content}`);
});
ClientCommands.set('echo', function (content: string) {
	RenderMessage('Info', content);
});
ClientCommands.set('close', function (content: string) {
	ConsoleWindow.Visible = false;
});
ClientCommands.set('exit', function (content: string) {
	ConsoleWindow.Visible = false;
});
ClientCommands.set('version', function (content: string) {
	RenderMessage('Info', `Game: "${placeinfo.name}" ver. ${placeinfo.version}`);
});
ClientCommands.set('setsize', function (content: string) {});

UserInputService.InputBegan.Connect((input, unavaiable) => {
	if (
		input.KeyCode === Enum.KeyCode.RightShift ||
		input.KeyCode === Enum.KeyCode.Insert ||
		input.KeyCode === Enum.KeyCode.F2
	) {
		ConsoleWindow.Visible = !ConsoleWindow.Visible;
	}
});

ConsoleWindow.GetPropertyChangedSignal('Visible').Connect(() => {
	if (ConsoleWindow.Visible) {
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
		RenderMessage('UserInput', content);
		Handle(content);
	}

	ConsoleInputBox.TextEditable = true;
	if (enterPressed) {
		task.wait();
		ConsoleInputBox.CaptureFocus();
		task.wait();
		ConsoleInputBox.Text = '';
	}
});
