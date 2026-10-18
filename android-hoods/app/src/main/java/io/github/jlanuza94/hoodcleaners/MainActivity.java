package io.github.jlanuza94.hoodcleaners;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Hood Cleaners para Android: el juego y three.js van dentro del APK (assets), así que funciona sin conexión. */
public class MainActivity extends Activity {
    private static final String URL = "file:///android_asset/index.html";
    private static final String ACCION_INSTALAR = "io.github.jlanuza94.hoodcleaners.INSTALAR";
    private WebView web;
    private volatile boolean descargando = false;

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
        web.addJavascriptInterface(new Puente(), "HoodApp");
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

    /** Lo que el juego puede pedirle a la app: descargar e instalar la versión nueva encima de esta. */
    private class Puente {
        @JavascriptInterface
        public void actualizar(String url) {
            if (descargando) return;
            descargando = true;
            new Thread(() -> instalar(url)).start();
        }
    }

    // Descarga el APK y se lo pasa al instalador de Android, que pide confirmación y lo instala encima (la partida se queda).
    private void instalar(String url) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setInstanceFollowRedirects(true);
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode());
            long total = c.getContentLengthLong();
            PackageInstaller pi = getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams p = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
            if (total > 0) p.setSize(total);
            int id = pi.createSession(p);
            try (PackageInstaller.Session sesion = pi.openSession(id)) {
                try (InputStream in = c.getInputStream(); OutputStream out = sesion.openWrite("hood-cleaners.apk", 0, total > 0 ? total : -1)) {
                    byte[] buf = new byte[65536];
                    long leido = 0;
                    int n, ultimo = -1;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n);
                        leido += n;
                        int pct = total > 0 ? (int) (leido * 100 / total) : -1;
                        if (pct != ultimo) { ultimo = pct; avisar("descargando", pct); }
                    }
                    sesion.fsync(out);
                }
                Intent i = new Intent(this, MainActivity.class).setAction(ACCION_INSTALAR);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                sesion.commit(PendingIntent.getActivity(this, id, i, flags).getIntentSender());
            }
            avisar("instalando", 100);
        } catch (Exception e) {
            descargando = false;
            avisar("error", -1);
        }
    }

    // El instalador responde aquí: si necesita que el usuario confirme, se le enseña la pantalla de Android.
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (!ACCION_INSTALAR.equals(intent.getAction())) return;
        int estado = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (estado == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirmar = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirmar != null) try { startActivity(confirmar); } catch (Exception e) { /* sin instalador */ }
        } else if (estado != PackageInstaller.STATUS_SUCCESS) {
            descargando = false;
            avisar("error", -1);
        }
    }

    private void avisar(String estado, int pct) {
        runOnUiThread(() -> web.evaluateJavascript("window.hcActualizacion && window.hcActualizacion('" + estado + "', " + pct + ")", null));
    }

    @Override
    protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    @Override
    protected void onPause() { super.onPause(); web.onPause(); }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }
}
