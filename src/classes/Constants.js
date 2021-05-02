export default {
    // * Constants to be used throughout the game.
    RESOURCE: {
        IMAGE: {
            ALL_IN_ONE_2: 'tile_all-in-one-2',
        },
        TILEMAP: {
            TRIAL_1: 'map_trial-1',
            TRIAL_2: 'map_trial-2',
            TRIAL_3: 'map_trial-3',
        },
        ATLAS: {
            ALL_IN_ONE_2: 'atlas_all-in-one-2',
            EFFECT_ATTACK_1: 'atlas_effect_attack-1',
            EFFECT_ATTACK_2: 'atlas_effect_attack-2',
            EFFECT_ATTACK_3: 'atlas_effect_attack-3',
        },
        AUDIO: {
            LOSE: 'audio_lose',
            WIN: 'audio_win',
            PLAYER_HURT: 'audio_player_hurt',
            PLAYER_DIE: 'audio_player_die',
            ENEMY_HURT: 'audio_enemy_hurt',
            ENEMY_DIE: 'audio_enemy_die',
            HEAL_SMALL: 'audio_heal_small',
            HEAL_LARGE: 'audio_heal_large',
            SLASH: 'audio_slash',
            SPIKE: 'audio_spike',
            THROWABLE: 'audio_throwable',
            FIELD: 'audio_field',
            GUN_1: 'audio_gun-1',
            GUN_2: 'audio_gun-2',
            LASER_1: 'audio_laser-1',
            LASER_2: 'audio_laser-2',
        },
    },
    SCENE: {
        PRELOADER: 'scene_preloader',
        TITLE: 'scene_title',
        // GAME: 'scene_game', // ! obsolete
        LEVELS: [
            'scene_game-level01',
            'scene_game-level02',
            'scene_game-level03',
        ],
        GAME_UI: 'scene_game-ui',
        GAME_END: 'scene_game-end',
    },
    COLOR: {
        HEAL: 0x6bea2a,
        HIT: 0xffffff,
        SLOW: 0x5b2986,
        POISON: 0x106910,
    },
};
