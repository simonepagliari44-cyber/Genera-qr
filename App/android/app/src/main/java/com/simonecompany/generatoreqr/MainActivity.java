package com.simonecompany.generatoreqr;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Deve essere registrato PRIMA di super.onCreate(): il bridge viene creato l'i
        registerPlugin(GallerySaverPlugin.class);
        super.onCreate(savedInstanceState);

        // Comportamento da app nativa: niente zoom, niente rimbalzo in overscroll
        WebSettings webSettings = getBridge().getWebView().getSettings();
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
    }
}
