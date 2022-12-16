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
import placeinfo from 'shared/components/placeinfo';
import Values from 'client/providers/values';
import Network from 'shared/network';

const UserInputService = game.GetService('UserInputService');
const Player = game.GetService('Players').LocalPlayer;

const net_ConsoleArg = Network.console_sendarg;
const net_GetCommands = Network.console_getcmds;
const Local_RenderToConsole = Signals.console_render;

//=============================================================================
// Server & Client cmd list
//=============================================================================
const ClientCommands = new Map<string, Callback>();
const ServerCommands = new Array<string>();

function update_server_commands() {
	net_GetCommands.InvokeServer().andThen(list => {
		list.forEach(str => {
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

function Print(Mode: ConsoleMessageType, Content: string) {
	const CustomColorSplit = Content.split('^');
	let FinalMessage = '';
	let Color = Color3.fromRGB(200, 200, 200);
	switch (Mode) {
		case 'Error': {
			Color = Color3.fromRGB(255, 170, 170);
			FinalMessage = '[!] ';
			break;
		}
		case 'Warn': {
			Color = Color3.fromRGB(255, 255, 180);
			FinalMessage = '[*] ';
			break;
		}
		case 'Chat': {
			FinalMessage = '[chat] ';
			break;
		}
		case 'UserInput': {
			FinalMessage = '> ';
			break;
		}
		default: {
			FinalMessage = '[-] ';
		}
	}

	if (CustomColorSplit.size() > 0)
		CustomColorSplit.forEach(str => {
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

	const prefab = LogPrefab.Clone();
	prefab.Visible = true;
	prefab.Parent = LogContent;
	prefab.LayoutOrder = Log_GetNextIndex();
	prefab.Name = '';
	prefab.Text = FinalMessage;
	prefab.TextColor3 = Color;

	LoggedMessages.insert(0, prefab);

	LogContent.CanvasPosition = new Vector2(0, 1e23);
}

//=============================================================================
// Interface
//=============================================================================
const Window = Player.WaitForChild('PlayerGui').WaitForChild('Main').FindFirstChild('ConsoleWindow') as Frame;
const LogContent = Window.FindFirstChildOfClass('ScrollingFrame')!;
const LogPrefab = LogContent.FindFirstChild('LogPrefab') as TextLabel;

const InputBox = Window.FindFirstChild('InputFrame')!.FindFirstChildOfClass('TextBox')!;

const SuggestionsFrame = Window.FindFirstChild('SuggestionFrame') as Frame;
const SuggestionPrefab = SuggestionsFrame.FindFirstChild('SuggestionPrefab') as TextLabel;

Window.Visible = false;
LogPrefab.Visible = false;
SuggestionsFrame.Visible = false; // to be changed later

function Log_GetNextIndex(): number {
	let next_index = 1;
	LogContent.GetChildren().forEach(inst => {
		if (inst !== LogPrefab && inst.IsA('TextLabel')) {
			if (inst.LayoutOrder >= next_index) next_index = inst.LayoutOrder + 1;
		}
	});
	return next_index;
}

function LogMessage_CVarInfo(cvar: ConVar<unknown>) {
	let description = cvar.description;
	let attributes = '';

	cvar.attributes.forEach((_, key) => {
		attributes = attributes + key + ', ';
	});
	if (description === '') description = 'None';

	Print('Info', `${cvar.name} is:"${tostring(cvar.value)}", default:"${cvar.original_value}"`);
	Print('Info', `Attributes: ${attributes}`);
	Print('Info', `Desc: ${description}`);
}

function Handle_Command(content: string) {
	const args = content.split(' ');
	const command = tostring(args[0]);
	args.remove(0);

	const equivalent_ConVar = CreatedVars.find((val, index, obj) => {
		return val.name === command;
	});
	if (equivalent_ConVar && !equivalent_ConVar.attributes.has('Hidden')) {
		if (args[0] === undefined) {
			LogMessage_CVarInfo(equivalent_ConVar);
			return;
		}

		if (equivalent_ConVar.attributes.has('Readonly')) {
			Print('Error', 'Variable is read-only.');
			return;
		}

		switch (equivalent_ConVar.value_type) {
			case 'number': {
				const attempt = tonumber(args[0]);
				if (attempt === undefined) {
					Print('Error', `Value must be a "${equivalent_ConVar.value_type}", got "string" !`);
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
			case 'boolean': {
				const arg = args[0];
				let final_value: boolean | undefined;

				if (arg === 'true') final_value = true;
				if (arg === 'false') final_value = false;
				if (final_value === undefined) {
					Print('Error', `Unknown value, boolean expected. Got: ${tostring(type(final_value))}`);
					break;
				}
				equivalent_ConVar.value = final_value;
				break;
			}
			default: {
				Print('Error', `Variable has unknown value type. "${equivalent_ConVar.value_type}"`);
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
			Print('Info', tostring(response));
			return;
		}
	}

	Print('Error', 'Unknown or restricted command');
}

ClientCommands.set('clear', function () {
	LogContent.GetChildren().forEach(inst => {
		if (inst.IsA('TextLabel') && inst !== LogPrefab) inst.Destroy();
	});
});
ClientCommands.set('say', function (content: string) {
	net_ConsoleArg.InvokeServer('say', [content]);
	Print('Chat', `${Player.DisplayName}: ${content}`);
});
ClientCommands.set('echo', function (content: string) {
	Print('Info', content);
});
ClientCommands.set('close', function (content: string) {
	Window.Visible = false;
});
ClientCommands.set('exit', function (content: string) {
	Window.Visible = false;
});
ClientCommands.set('version', function (content: string) {
	Print('Info', `Game: "${placeinfo.name}" ver. ${placeinfo.version}`);
});
ClientCommands.set('setsize', function (content: string) {});

Signals.console_sendarg.Connect(argument => Handle_Command(argument));

UserInputService.InputBegan.Connect((input, unavaiable) => {
	if (
		input.KeyCode === Enum.KeyCode.RightShift ||
		input.KeyCode === Enum.KeyCode.Insert ||
		input.KeyCode === Enum.KeyCode.F2
	) {
		Window.Visible = !Window.Visible;
	}
});

Window.GetPropertyChangedSignal('Visible').Connect(() => {
	if (Window.Visible) {
		InputBox.TextEditable = true;
		InputBox.CaptureFocus();
		Values.camUnlock.set('Console', true);
	} else {
		InputBox.ReleaseFocus();
		InputBox.TextEditable = false;
		Values.camUnlock.delete('Console');
	}
});

InputBox.FocusLost.Connect(enterPressed => {
	InputBox.TextEditable = false;
	const content = InputBox.Text;
	if (enterPressed) {
		Print('UserInput', content);
		Handle_Command(content);
	}

	InputBox.TextEditable = true;
	if (enterPressed) {
		task.wait();
		InputBox.CaptureFocus();
		task.wait();
		InputBox.Text = '';
	}
});
