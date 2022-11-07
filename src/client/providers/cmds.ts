const console_cmds = new Map<string, unknown>([
	// (client game) values
	['cg_fov', 80],
	['cg_hitsound', 1],
	['cg_draw_tracers', 1],
	['username', 'Player'],

	// (render) values
	['r_drawtracers_firstperson', 1],
	['r_drawtracers', 1],
	['r_clouds', 1],

	// (user interface) values
	['ui_enabled', 1],
	['ui_showfps', 0],
	['ui_killnotf', 1],
	['ui_damagenumbers', 1],
	['ui_legacyscoreboard', 0],
	['ui_mouseiconenabled', 1],

	// (networking) values
	['net_graph', 0],
]);

export = console_cmds;
