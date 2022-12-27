// Author: coolergate#2031
// Reason: Startup client game

import * as Defined from 'shared/gamedefined';

// Wait until the server is ready, should be in normal game
// there is an issue in studio where the player logs on before Players.PlayerAdded
do task.wait(1);
while (!Defined.ServerRunning());

// import main
import * as main from './main';
