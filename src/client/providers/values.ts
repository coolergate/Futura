//========= Copyright GGC Studios, All rights reserved. ============//
// Purpose: Store script values to be used with other scripts		//
//==================================================================//

const Values = {
	// character values
	Character: {
		Health: 0,
		MaxHealth: 150,
		CollisionBox: undefined as PlayerCollisionModel | undefined,
		Id: '',
	},

	// Movement values
	MovementInputRequest: false,

	// camera values
	CCameraCFrame: new CFrame(),
	CCameraDelta: new Vector2(),
	CCameraEnable: true,
	CCameraUnlock: new Map<string, boolean>(),
	CCameraLockTo: undefined as BasePart | undefined,
};

export = Values;
