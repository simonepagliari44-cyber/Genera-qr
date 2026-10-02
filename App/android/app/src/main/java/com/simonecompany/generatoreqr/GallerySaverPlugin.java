package com.simonecompany.generatoreqr;

import android.Manifest;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Salva l'immagine PNG del codice QR direttamente nella galleria fotografica.
 *
 * API 29+ : scrittura tramite MediaStore in Pictures/Generatore-QR.
 * API 24-28 : scrittura nella stessa cartella con permesso
 *            WRITE_EXTERNAL_STORAGE e notifica al MediaScanner,
 *            altrimenti fallback nella cartella privata dell'app.
 */
@CapacitorPlugin(
    name = "GallerySaver",
    permissions = {
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage"),
        @Permission(strings = { Manifest.permission.READ_EXTERNAL_STORAGE }, alias = "readStorage"),
        @Permission(strings = { Manifest.permission.READ_MEDIA_IMAGES }, alias = "mediaImages")
    }
)
public class GallerySaverPlugin extends Plugin {

    private static final String ALBUM = "Generatore-QR";
    private static final String STORAGE_ALIAS = "storage";
    private static final String MEDIA_ALIAS = "mediaImages";

    private String pendingAlias = null;

    /** Cartella Pictures/Generatore-QR creata (o ricreata se l'utente l'ha eliminata). */
    @PluginMethod
    public void ensureFolder(PluginCall call) {
        File album = publicAlbum();
        boolean existed = album.exists();
        boolean created = !existed && album.mkdirs();

        JSObject result = new JSObject();
        result.put("album", ALBUM);
        result.put("exists", album.exists());
        result.put("created", created);
        result.put("path", album.getAbsolutePath());
        call.resolve(result);
    }

    /** Richiesta del permesso piu' appropriato per la versione di Android in uso. */
    @PluginMethod
    public void requestStoragePermission(PluginCall call) {
        String alias = neededAlias();

        JSObject result = new JSObject();
        result.put("alias", alias);

        if (alias == null) {
            // Android 10+ con permessi granulari: il salvataggio in galleria e' sempre consentito.
            result.put("granted", true);
            result.put("required", false);
            call.resolve(result);
            return;
        }

        result.put("required", true);

        if (getPermissionState(alias) == PermissionState.GRANTED) {
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        pendingAlias = alias;
        requestPermissionForAlias(alias, call, "storagePermissionCallback");
    }

    private String neededAlias() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return MEDIA_ALIAS;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return null; // Android 10-12: nessun permesso runtime necessario
        }
        return STORAGE_ALIAS;
    }

    @PluginMethod
    public void savePng(PluginCall call) {
        String data = call.getString("data", "");
        String fileName = call.getString("fileName", "qrcode.png");

        if (data.isEmpty()) {
            call.reject("Immagine vuota");
            return;
        }

        int comma = data.indexOf(',');
        if (data.startsWith("data:") && comma > -1) {
            data = data.substring(comma + 1);
        }

        final byte[] bytes;
        try {
            bytes = Base64.decode(data, Base64.DEFAULT);
        } catch (Exception ex) {
            call.reject("Immagine non valida: " + ex.getMessage());
            return;
        }

        if (requiresLegacyPermission() && getPermissionState(STORAGE_ALIAS) != PermissionState.GRANTED) {
            requestPermissionForAlias(STORAGE_ALIAS, call, "storagePermissionCallback");
            return;
        }

        writeAsync(call, bytes, fileName);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        String alias = pendingAlias == null ? STORAGE_ALIAS : pendingAlias;
        boolean granted = getPermissionState(alias) == PermissionState.GRANTED;

        if (!call.getData().has("data")) {
            JSObject result = new JSObject();
            result.put("granted", granted);
            result.put("alias", alias);
            call.resolve(result);
            return;
        }

        // writeLegacy() ricade sulla cartella privata dell'app se il permesso non e' stato concesso.
        writeAsync(call, decode(call.getString("data", "")), call.getString("fileName", "qrcode.png"));
    }

    private byte[] decode(String data) {
        int comma = data.indexOf(',');
        if (data.startsWith("data:") && comma > -1) {
            data = data.substring(comma + 1);
        }
        try {
            return Base64.decode(data, Base64.DEFAULT);
        } catch (Exception ex) {
            return new byte[0];
        }
    }

    private File publicAlbum() {
        return new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), ALBUM);
    }

    private boolean requiresLegacyPermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q;
    }

    private void writeAsync(final PluginCall call, final byte[] bytes, final String fileName) {
        Thread thread = new Thread(() -> {
            final JSObject result;
            try {
                result = requiresLegacyPermission() ? writeLegacy(bytes, fileName) : writeMediaStore(bytes, fileName);
            } catch (Exception ex) {
                final String message = ex.getMessage() == null ? ex.toString() : ex.getMessage();
                getBridge().execute(() -> call.reject("Salvataggio non riuscito: " + message));
                return;
            }
            getBridge().execute(() -> call.resolve(result));
        });
        thread.start();
    }

    private JSObject writeMediaStore(byte[] bytes, String fileName) throws Exception {
        Context context = getContext();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, uniqueName(fileName));
        values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + ALBUM);
        values.put(MediaStore.Images.Media.IS_PENDING, 1);

        Uri collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        Uri item = context.getContentResolver().insert(collection, values);

        if (item == null) {
            throw new IllegalStateException("MediaStore non ha accettato il file");
        }

        OutputStream out = context.getContentResolver().openOutputStream(item);
        if (out == null) {
            context.getContentResolver().delete(item, null, null);
            throw new IllegalStateException("Impossibile aprire il file in scrittura");
        }
        try {
            out.write(bytes);
            out.flush();
        } finally {
            out.close();
        }

        values.clear();
        values.put(MediaStore.Images.Media.IS_PENDING, 0);
        context.getContentResolver().update(item, values, null, null);

        JSObject result = new JSObject();
        result.put("saved", true);
        result.put("location", "gallery");
        result.put("uri", item.toString());
        result.put("album", ALBUM);
        return result;
    }

    private JSObject writeLegacy(byte[] bytes, String fileName) throws Exception {
        Context context = getContext();
        File album = publicAlbum();
        boolean inGallery = album.exists() || album.mkdirs();

        if (!inGallery) {
            album = new File(context.getExternalFilesDir(Environment.DIRECTORY_PICTURES), ALBUM);
            inGallery = false;
        }
        if (!album.exists()) {
            album.mkdirs();
        }

        File file = new File(album, uniqueName(fileName));
        FileOutputStream fos = new FileOutputStream(file);
        try {
            fos.write(bytes);
            fos.flush();
        } finally {
            fos.close();
        }

        if (inGallery) {
            MediaScannerConnection.scanFile(context, new String[] { file.getAbsolutePath() }, new String[] { "image/png" }, null);
        }

        JSObject result = new JSObject();
        result.put("saved", true);
        result.put("location", inGallery ? "gallery" : "app");
        result.put("uri", Uri.fromFile(file).toString());
        result.put("path", file.getAbsolutePath());
        result.put("album", ALBUM);
        return result;
    }

    private String uniqueName(String fileName) {
        return fileName.replaceAll("[^A-Za-z0-9._-]", "_");
    }
}