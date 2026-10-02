import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const androidDir = join(root, 'android');

if (!existsSync(androidDir)) {
  console.error('Progetto Android non presente: esegui "npx cap add android" prima.');
  process.exit(1);
}

const javaDir = join(androidDir, 'app/src/main/java/com/simonecompany/generatoreqr');
mkdirSync(javaDir, { recursive: true });

// 1. Plugin nativo per il salvataggio in galleria
copyFileSync(join(root, 'native', 'GallerySaverPlugin.java'), join(javaDir, 'GallerySaverPlugin.java'));

// 2. Registrazione del plugin in MainActivity (idempotente)
const mainActivityPath = join(javaDir, 'MainActivity.java');

const mainActivitySource = `package com.simonecompany.generatoreqr;

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
`;

const currentMainActivity = existsSync(mainActivityPath) ? readFileSync(mainActivityPath, 'utf8') : '';

if (currentMainActivity !== mainActivitySource) {
  writeFileSync(mainActivityPath, mainActivitySource);
  console.log('MainActivity aggiornata (plugin + blocco zoom)');
}

// 3. minSdk 24 (Android 7.0) in variables.gradle
const variablesPath = join(androidDir, 'variables.gradle');
let variables = readFileSync(variablesPath, 'utf8');
variables = variables.replace(/minSdkVersion = \d+/, 'minSdkVersion = 24');
writeFileSync(variablesPath, variables);

// 4. Permesso di scrittura in memoria per Android 7/8 (API <= 28)
const manifestPath = join(androidDir, 'app/src/main/AndroidManifest.xml');
let manifest = readFileSync(manifestPath, 'utf8');

const permissions = [
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />'
];

const missing = permissions.filter((line) => !manifest.includes(line));

if (missing.length) {
  manifest = manifest.replace(
    '    <uses-permission android:name="android.permission.INTERNET" />',
    ['    <uses-permission android:name="android.permission.INTERNET" />', ...missing].join('\n')
  );
  writeFileSync(manifestPath, manifest);
  console.log('Permessi aggiunti al manifest:', missing.length);
}

console.log('Codice nativo installato nel progetto Android');