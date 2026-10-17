package io.github.jlanuza94.hoodcleaners;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Hood Cleaners para Android: el juego y three.js van dentro del APK (assets), así que funciona sin conexión. */
public class MainActivity extends Activity {
    private static final String URL = "file:///android_asset/index.html";
    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON); // que no se apague en mitad del turno
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setTextZoom(100); // el juego ya ajusta sus tamaños: no agrandar con la letra del sistema
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true); // la partida se guarda en localStorage
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                if (url.startsWith("file:///android_asset/")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) { /* sin app para abrirlo */ }
                return true;
            }
        });
        if (state != null) web.restoreState(state); else web.loadUrl(URL);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    @Override
    protected void onPause() { super.onPause(); web.onPause(); }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }
}
