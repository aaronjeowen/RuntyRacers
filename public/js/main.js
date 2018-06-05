var game = new Phaser.Game(3000, 2400, Phaser.AUTO, 'gameDiv');
game.state.add('Game',Game);
game.state.start('Game');
