import {RecordButton} from "./recordButton.jsm";

export class RecordButtonSoundEffect extends RecordButton {

    constructor(recordButton, startRecordingSoundEffect, stopRecordingSoundEffect) {
        super(recordButton.$view, recordButton.state, recordButton.mediaResources, recordButton.recorder, recordButton.player, recordButton.timer, recordButton.soundIntensity, recordButton.recordingTimer);
        this.startRecordingSoundEffect = startRecordingSoundEffect;
        this.stopRecordingSoundEffect = stopRecordingSoundEffect;
        this._initSoundEffectLogic();
    }

    _record(stream) {
        if (this.startRecordingSoundEffect.isValid()) {
            this.startRecordingSoundEffect.playSound();
            super._record(stream);
        }
        else
            super._record(stream);
    }

    _onStopRecording() {
        if (this.stopRecordingSoundEffect.isValid())
            this.stopRecordingSoundEffect.playSound();
        else
            super._onStopRecording();
    }

    _initSoundEffectLogic() {
        this.startRecordingSoundEffect.onStartCallback = () => {
        };
        this.startRecordingSoundEffect.onStopCallback = () => {
        };

        this.stopRecordingSoundEffect.onStartCallback = () => {
            this.deactivate();
            super._onStopRecording();
            this.state.setRecording();
        };

        this.stopRecordingSoundEffect.onStopCallback = () => {
            this.activate();
            this.state.setLoaded();
        };
    }
}