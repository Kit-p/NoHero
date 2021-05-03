import Phaser from 'phaser';

import Constants from '../classes/Constants';

export class PreloaderScene extends Phaser.Scene {
    // * This class loads all needed resources for the game for efficiency.

    constructor() {
        super({ key: Constants.SCENE.PRELOADER });
    }

    preload() {
        // load images
        this.load.image(
            Constants.RESOURCE.IMAGE.ALL_IN_ONE_2,
            'assets/tiles/all-in-one/2.png'
        );
        this.load.image(
            Constants.RESOURCE.IMAGE.BACKGROUND,
            'assets/images/background.png'
        );
        this.load.image(
            Constants.RESOURCE.IMAGE.SKULL,
            'assets/images/skull.jpg'
        );
        this.load.image(
            Constants.RESOURCE.IMAGE.TREASURE,
            'assets/images/treasure.png'
        );

        // load tilemaps
        this.load.tilemapTiledJSON(
            Constants.RESOURCE.TILEMAP.TRIAL_1,
            'assets/maps/trial-1.json'
        );
        this.load.tilemapTiledJSON(
            Constants.RESOURCE.TILEMAP.TRIAL_2,
            'assets/maps/trial-2.json'
        );
        this.load.tilemapTiledJSON(
            Constants.RESOURCE.TILEMAP.TRIAL_3,
            'assets/maps/trial-3.json'
        );

        // load atlas
        this.load.atlas(
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'assets/tiles/all-in-one/2.png',
            'assets/tiles/atlases/tile_all-in-one-2.json'
        );
        this.load.atlas(
            Constants.RESOURCE.ATLAS.EFFECT_ATTACK_1,
            'assets/tiles/effects/attack-1.png',
            'assets/tiles/atlases/effect_attack-1.json'
        );
        this.load.atlas(
            Constants.RESOURCE.ATLAS.EFFECT_ATTACK_2,
            'assets/tiles/effects/attack-2.png',
            'assets/tiles/atlases/effect_attack-2.json'
        );
        this.load.atlas(
            Constants.RESOURCE.ATLAS.EFFECT_ATTACK_3,
            'assets/tiles/effects/attack-3.png',
            'assets/tiles/atlases/effect_attack-3.json'
        );

        // load audio
        this.load.audio(Constants.RESOURCE.AUDIO.BGM, 'assets/audio/bgm.wav');
        this.load.audio(
            Constants.RESOURCE.AUDIO.SELECT,
            'assets/audio/select.wav'
        );
        this.load.audio(Constants.RESOURCE.AUDIO.LOSE, 'assets/audio/lose.wav');
        this.load.audio(Constants.RESOURCE.AUDIO.WIN, 'assets/audio/win.wav');
        this.load.audio(
            Constants.RESOURCE.AUDIO.PLAYER_HURT,
            'assets/audio/player_hurt.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.PLAYER_DIE,
            'assets/audio/player_die.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.ENEMY_HURT,
            'assets/audio/enemy_hurt.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.ENEMY_DIE,
            'assets/audio/enemy_die.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.HEAL_SMALL,
            'assets/audio/heal_small.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.HEAL_LARGE,
            'assets/audio/heal_large.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.SLASH,
            'assets/audio/slash_1.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.SPIKE,
            'assets/audio/spike.mp3'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.THROWABLE,
            'assets/audio/throwable_1.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.FIELD,
            'assets/audio/field_1.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.GUN_1,
            'assets/audio/gun_1.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.GUN_2,
            'assets/audio/gun_2.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.LASER_1,
            'assets/audio/laser_1.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.LASER_2,
            'assets/audio/laser_2.wav'
        );
        this.load.audio(
            Constants.RESOURCE.AUDIO.FOOTSTEP,
            'assets/audio/footstep.wav'
        );
    }

    create() {
        this.scene.start(Constants.SCENE.TITLE);
    }
}
