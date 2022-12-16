// Author: coolergate#2031
// Purpose: Store script values to be used with other scripts
//==================================================================//

const Values = {
	Character: undefined as ent_CharacterInfo | undefined,

	// camera values
	camCFrame: new CFrame(),
	camDelta: new Vector2(),
	camEnable: true,
	camUnlock: new Map<string, boolean>(),
};

export = Values;
