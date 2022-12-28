// Author: coolergate#2031
// Reason: Initialize client

import * as Folders from 'shared/folders';
import * as Signals from './providers/signals';
import * as Network from 'shared/network';
import placeinfo from 'shared/placeinfo';
import Values from './providers/values';
import { CreatedVars, CVar } from 'shared/vars';

const ReplicatedStorage = game.GetService('ReplicatedStorage');
const UserInputService = game.GetService('UserInputService');
const ContentProvider = game.GetService('ContentProvider');
const TweenService = game.GetService('TweenService');
const RunService = game.GetService('RunService');
const StarterGui = game.GetService('StarterGui');
const Players = game.GetService('Players');

const Player = Players.LocalPlayer;
const PlayerGui = Player.WaitForChild('PlayerGui') as PlayerGui;

StarterGui.SetCoreGuiEnabled('All', false);

//SECTION Console
declare global {
	type ConsoleMessageType = 'Info' | 'Error' | 'Warn' | 'UserInput';
}

const network_console_arg = Network.console_sendarg;
const network_console_get = Network.console_getcmds;
const signal_render_console = Signals.Console_RenderMessage;

const client_commands = new Map<string, Callback>();
const server_commands = new Array<string>();

function update_server_commands() {
	network_console_get.InvokeServer().andThen(list => {
		list.forEach(str => {
			if (!server_commands.includes(str)) server_commands.insert(0, str);
		});
		server_commands.forEach((str, index) => {
			if (!list.includes(str)) server_commands.remove(index);
		});
	});
}

const LoggedMessages = new Array<TextLabel>();
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

const ConsoleHolder = Folders.Interface.FindFirstChild('Console') as ScreenGui;
const ConsoleWindow = ConsoleHolder.FindFirstChild('Window') as Frame;
const ConsoleContent = ConsoleWindow.FindFirstChild('Content') as ScrollingFrame;
const ConsoleLogPrefab = ConsoleContent.FindFirstChild('LogPrefab') as TextLabel;
const ConsoleInput = ConsoleWindow.WaitForChild('Input').FindFirstChildOfClass('TextBox')!;

ConsoleHolder.Parent = PlayerGui;
ConsoleHolder.Enabled = false;
ConsoleWindow.Visible = true;
ConsoleLogPrefab.Visible = false;

function Console_GetNextIndex(): number {
	let next_index = 1;
	ConsoleContent.GetChildren().forEach(inst => {
		if (inst !== ConsoleLogPrefab && inst.IsA('TextLabel')) {
			if (inst.LayoutOrder >= next_index) next_index = inst.LayoutOrder + 1;
		}
	});
	return next_index;
}

export function Console_LogCvarInfo(cvar: CVar<unknown>) {
	let description = cvar.description;
	let attributes = '';

	cvar.attributes.forEach((_, key) => {
		attributes = attributes + key + ', ';
	});
	if (description === '') description = 'None';

	std_print('Info', `${cvar.name} is:"${tostring(cvar.value)}", default:"${cvar.original_value}"`);
	std_print('Info', `Attributes: ${attributes}`);
	std_print('Info', `Desc: ${description}`);
}

export function std_print(Mode: ConsoleMessageType, Content: string) {
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

	const prefab = ConsoleLogPrefab.Clone();
	prefab.Visible = true;
	prefab.Parent = ConsoleContent;
	prefab.LayoutOrder = Console_GetNextIndex();
	prefab.Name = '';
	prefab.Text = FinalMessage;
	prefab.TextColor3 = Color;

	LoggedMessages.insert(0, prefab);

	ConsoleContent.CanvasPosition = new Vector2(0, 1e23);
}

function Handle_Command(content: string) {
	const args = content.split(' ');
	const command = tostring(args[0]);

	const equivalent_ConVar = CreatedVars.find((val, index, obj) => {
		return val.name === command;
	});
	if (equivalent_ConVar && !equivalent_ConVar.attributes.has('Hidden')) {
		if (args[1] === undefined) {
			Console_LogCvarInfo(equivalent_ConVar);
			return;
		}

		if (equivalent_ConVar.attributes.has('Readonly')) {
			std_print('Error', 'Variable is read-only.');
			return;
		}

		switch (equivalent_ConVar.value_type) {
			case 'number': {
				const attempt = tonumber(args[1]);
				if (attempt === undefined) {
					std_print('Error', `Value must be a "${equivalent_ConVar.value_type}", got "string" !`);
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
				const arg = args[1];
				let final_value: boolean | undefined;

				if (arg === 'true') final_value = true;
				if (arg === 'false') final_value = false;
				if (final_value === undefined) {
					std_print('Error', `Unknown value, boolean expected. Got: ${tostring(type(final_value))}`);
					break;
				}
				equivalent_ConVar.value = final_value;
				break;
			}
			default: {
				std_print('Error', `Variable has unknown value type. "${equivalent_ConVar.value_type}"`);
			}
		}

		return;
	}

	// else check if it is an callable function
	if (client_commands.has(command)) {
		const arg = content.sub(command.size() + 2, content.size());
		client_commands.get(command)!(arg);
		return;
	}

	// check if it's an server command
	if (server_commands.includes(command)) {
		const [server_recieved, response] = network_console_arg.InvokeServer(args).await();
		if (response !== undefined) {
			std_print('Info', tostring(response));
			return;
		}
	}

	std_print('Error', 'Unknown or restricted command');
}

client_commands.set('clear', function () {
	ConsoleContent.GetChildren().forEach(inst => {
		if (inst.IsA('TextLabel') && inst !== ConsoleLogPrefab) inst.Destroy();
	});
});
client_commands.set('say', function (content: string) {
	network_console_arg.InvokeServer(['say', content]);
	//Print('Chat', `${Player.DisplayName}: ${content}`);
	std_print('Info', `${Player.DisplayName}: ${content}`);
});
client_commands.set('echo', function (content: string) {
	std_print('Info', content);
});
client_commands.set('close', function (content: string) {
	ConsoleWindow.Visible = false;
});
client_commands.set('exit', function (content: string) {
	ConsoleWindow.Visible = false;
});
client_commands.set('version', function (content: string) {
	std_print('Info', `Game: "${placeinfo.name}" ver. ${placeinfo.version}`);
});
client_commands.set('setsize', function (content: string) {});

Signals.Console_SendCommand.Connect(argument => Handle_Command(argument));

UserInputService.InputBegan.Connect((input, unavaiable) => {
	if (
		input.KeyCode === Enum.KeyCode.RightShift ||
		input.KeyCode === Enum.KeyCode.Insert ||
		input.KeyCode === Enum.KeyCode.F2
	) {
		ConsoleHolder.Enabled = !ConsoleHolder.Enabled;
	}
});

ConsoleHolder.GetPropertyChangedSignal('Enabled').Connect(() => {
	if (ConsoleHolder.Enabled) {
		ConsoleInput.TextEditable = true;
		ConsoleInput.CaptureFocus();
		Values.Camera_Unlock.set('Console', true);
	} else {
		ConsoleInput.ReleaseFocus();
		ConsoleInput.TextEditable = false;
		Values.Camera_Unlock.delete('Console');
	}
});

ConsoleInput.FocusLost.Connect(enterPressed => {
	ConsoleInput.TextEditable = false;
	const content = ConsoleInput.Text;
	if (enterPressed) {
		std_print('UserInput', content);
		Handle_Command(content);
	}

	ConsoleInput.TextEditable = true;
	if (enterPressed) {
		task.wait();
		ConsoleInput.CaptureFocus();
		task.wait();
		ConsoleInput.Text = '';
	}
});

update_server_commands();
//!SECTION Console

//ANCHOR Interface
const LoadingGui = Folders.Interface.FindFirstChild('Loading') as ScreenGui & {
	Main: CanvasGroup & {
		Logo: TextLabel & {
			UIGradient: UIGradient;
		};
		Info: TextLabel;
	};
};

LoadingGui.Parent = PlayerGui;
LoadingGui.Enabled = true;
const Loading_Canvas = LoadingGui.Main;
const Loading_InfoText = Loading_Canvas.Info;
const Loading_LogoGradient = Loading_Canvas.Logo.UIGradient;
{
	let CurrentTween: Tween | undefined;
	Loading_LogoGradient.Offset = new Vector2(-1, 0);

	Loading_InfoText.Text = '';

	coroutine.wrap(() => {
		do {
			if (!CurrentTween) {
				Loading_LogoGradient.Offset = new Vector2(-1, 0);
				CurrentTween = TweenService.Create(Loading_LogoGradient, new TweenInfo(1), {
					Offset: new Vector2(1, 0),
				});
				CurrentTween.Play();
				CurrentTween.Completed.Wait();
				task.wait(1);
				CurrentTween?.Destroy();
				CurrentTween = undefined;
			} else task.wait();
		} while (PlayerGui.FindFirstChild('Loading') !== undefined);
	})();
}

Folders.Interface.GetChildren().forEach(element => {
	if (element.IsA('ScreenGui')) {
		element.Enabled = true;
		element.Parent = PlayerGui;
	}
});

//=============================================================================
// Pre-Load content and call server login
//=============================================================================

task.wait(5);
const List = ReplicatedStorage.GetDescendants();
List.sort((a, b) => {
	return a.ClassName > b.ClassName;
});
List.forEach((inst, index) => {
	Loading_InfoText.Text = `Loading ${inst.ClassName}... (${index} / ${List.size()})`;
	ContentProvider.PreloadAsync([inst]);
});

Loading_InfoText.Text = 'Sending login request...';
Network.PlayerLogin.InvokeServer().await();

//=============================================================================
// Components
//=============================================================================
Loading_InfoText.Text = 'Initializing components...';
declare global {
	interface BaseClientComponent {
		/**
		 * Called in sync with other scripts
		 */
		Start(): void;

		/**
		 * Called every frame
		 */
		Update(delta_time: number): void;

		/**
		 * Called every frame when it matches 60FPS
		 */
		FixedUpdate(delta_time: number): void;
	}
}
interface BaseComponentBuilder {
	InitOrder: number;
	Init(): BaseClientComponent;
}
interface ComponentInfo {
	Name: string;
	InitOrder: number;
	Module: BaseComponentBuilder;
}

const Folder = Folders.MainScriptFolder.FindFirstChild('components') as Folder;
const Components = new Array<ComponentInfo>();
const BuiltComponents = new Array<BaseClientComponent>();

// Add components
Folder.GetChildren().forEach(inst => {
	if (!inst.IsA('ModuleScript')) return;
	std_print('Info', 'Adding component: ' + inst.Name);
	print('Adding component:', inst.Name);
	const module = require(inst) as BaseComponentBuilder;
	const info: ComponentInfo = {
		Name: inst.Name,
		InitOrder: module.InitOrder,
		Module: module,
	};
	Components.insert(0, info);
});
Components.sort((a, b) => {
	return a.InitOrder < b.InitOrder;
});

// Init
Components.forEach(v => {
	std_print('Info', `Starting component ${v.Name}...`);
	print('Starting component:', v.Name);
	const build = v.Module.Init();
	BuiltComponents.insert(0, build);
});

BuiltComponents.forEach(component =>
	coroutine.wrap(() => {
		component.Start();

		let FrameTime = 0;
		RunService.RenderStepped.Connect(dt => {
			component.Update(dt);
			FrameTime += dt;
			if (FrameTime < 1 / 60) return;
			FrameTime = 0;
			component.FixedUpdate(FrameTime);
		});
	})(),
);

Signals.Start.Fire(); // start non-modules

StarterGui.SetCore('ResetButtonCallback', false);
task.wait(1);

// space to continue
Loading_InfoText.Text = 'Press <font color="rgb(255,58,41)">SPACE</font> to continue';
let wait_for_input = true;
const input_connection = UserInputService.InputBegan.Connect(input => {
	if (input.KeyCode.Name !== 'Space') return;
	wait_for_input = false;
});
while (wait_for_input) RunService.RenderStepped.Wait();
input_connection.Disconnect();
Signals.GUI_OpenMenu.Fire();

const LoadingScreenFadeOut = TweenService.Create(Loading_Canvas, new TweenInfo(0.5), { GroupTransparency: 1 });
LoadingScreenFadeOut.Completed.Connect(() => {
	Loading_Canvas.Destroy();
	LoadingScreenFadeOut.Destroy();
});
LoadingScreenFadeOut.Play();
