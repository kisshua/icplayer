export class AssetService {

    constructor(playerController, recordingState) {
        this.playerController = playerController;
        this.recordingState = recordingState;
    }

    storeAsset(blob) {
        this.playerController.storeAsset(blob, result => {
            if (result){
                let deserializedResult = JSON.parse(result);
                this.recordingState.setMediaSource(deserializedResult.href);
            }
        })
    }
}