module.exports = {
    'name': 'playable-template',
    'networks': ['Applovin', 'Facebook', 'Google', 'IronSource', 'Liftoff', 'TikTok', 'UnityAds', 'Vungle'],
    'customPhaser': true,
    'compressAtlas': true,
    'compressTexture': true,
    'compressAudio': true,
    'ios':     'https://apps.apple.com/app/your-app-id',
    'android': 'https://play.google.com/store/apps/details?id=com.yourcompany.yourapp',

    // Dev mode: which version to preview locally.
    // Use 's1-t(s2-s3)' or 't(s1)' to exercise TransitionScene during development.
    'currentVersion': 's1',

    // ── Build variants ─────────────────────────────────────────────────────────
    // flow: ordered array of scene ids.  A nested array means "player chooses one
    //       of these scenes at this stage" (TransitionScene is shown automatically).
    // levelSelect: true  →  first screen is TransitionScene (choice from the start).
    // Assets are shared across all variants; only the flow and levelSelect differ.
    'versions': {
        // single-scene builds
        's1':           { flow: ['scene-1'],            audio: [], fonts: [], sheets: [], textures: [] },
        's2':           { flow: ['scene-2'],            audio: [], fonts: [], sheets: [], textures: [] },
        's3':           { flow: ['scene-3'],            audio: [], fonts: [], sheets: [], textures: [] },

        // one forced scene, then choose from the remaining two
        's1-t(s2-s3)':  { flow: ['scene-1', ['scene-2', 'scene-3']], audio: [], fonts: [], sheets: [], textures: [] },
        's2-t(s1-s3)':  { flow: ['scene-2', ['scene-1', 'scene-3']], audio: [], fonts: [], sheets: [], textures: [] },
        's3-t(s1-s2)':  { flow: ['scene-3', ['scene-1', 'scene-2']], audio: [], fonts: [], sheets: [], textures: [] },

        // choice-from-start builds
        't(s1)':        { flow: [['scene-1']],                       levelSelect: true, audio: [], fonts: [], sheets: [], textures: [] },
        't(s2)':        { flow: [['scene-2']],                       levelSelect: true, audio: [], fonts: [], sheets: [], textures: [] },
        't(s3)':        { flow: [['scene-3']],                       levelSelect: true, audio: [], fonts: [], sheets: [], textures: [] },
        't(s1)-t(s2-s3)': { flow: [['scene-1'], ['scene-2', 'scene-3']], levelSelect: true, audio: [], fonts: [], sheets: [], textures: [] },
        't(s2)-t(s1-s3)': { flow: [['scene-2'], ['scene-1', 'scene-3']], levelSelect: true, audio: [], fonts: [], sheets: [], textures: [] },
        't(s3)-t(s1-s2)': { flow: [['scene-3'], ['scene-1', 'scene-2']], levelSelect: true, audio: [], fonts: [], sheets: [], textures: [] },
    }
};
