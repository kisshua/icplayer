package com.lorepo.icplayer.client.module.api.event;

import com.google.gwt.event.shared.EventHandler;

public class GradualShowAnswerEvent extends PlayerEvent<GradualShowAnswerEvent.Handler> {

    public static final String NAME = "GradualShowAnswers";

    public static Type<GradualShowAnswerEvent.Handler> TYPE = new Type<GradualShowAnswerEvent.Handler>();
    private String item = "0";
    private String moduleID = "";

    public interface Handler extends EventHandler {
        void onGradualShowAnswers(GradualShowAnswerEvent event);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public Type<GradualShowAnswerEvent.Handler> getAssociatedType() {
        return TYPE;
    }

    @Override
    protected void dispatch(Handler handler) {
        handler.onGradualShowAnswers(this);
    }

    public String getItem() {
        return item;
    }

    public String getModuleID() {
        return moduleID;
    }

    public void setItem(String item) {
        this.item = item;
    }

    public void setModuleID(String moduleID) {
        this.moduleID = moduleID;
    }

}
