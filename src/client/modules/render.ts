const RenderPriorities = {
	UserInput: 10,
	CameraInput: 99,
	CameraRender: 100,
	CharacterMovementInput: 299,
	CharacterMovement: 300,
	CharacterRegions: 301,
	InterfacePre: 499,
	Interface: 500,
	Final: 999,
};

export = RenderPriorities;
