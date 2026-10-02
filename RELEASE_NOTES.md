<div align="center">

# 📱 **Generatore QR** 🚀
<img src="Sito%20Web/favicon.svg" alt="Icona Generatore QR" width="120" height="120" />

### *App Android per la generazione e il download dei codici QR*

---

</div>

## 📌 **Panoramica**

**Generatore QR** è un'app Android nativa, costruita con **Capacitor**, che genera codici QR personalizzabili e li salva direttamente nella galleria fotografica del dispositivo.

L'app funziona **completamente offline**: nessuna connessione internet richiesta, nessun account, nessun dato raccolto. Tutto viene elaborato sul dispositivo.

---

## ✨ **Caratteristiche**

* 🎯 **13 tipologie di QR:** Sito/Link, WhatsApp, Wi-Fi, Contatto vCard, Evento iCal, Posizione GPS, E-mail, SMS, Chiamata, Bluetooth, App Store, Bitcoin, Testo libero.
* 💾 **Salvataggio in Galleria:** un tocco e il PNG viene scritto nella cartella `Immagini/Generatore-QR` e compare subito nella galleria fotografica.
* 📁 **Cartella dedicata:** `Generatore-QR` viene creata automaticamente all'avvio e ricreata da sola se l'utente la elimina.
* 🔄 **Condivisione:** il menu di condivisione si apre **solo** quando premi il pulsante "Condividi QR" (invia a WhatsApp, Telegram, e-mail, ecc.).
* 🎨 **Massima personalizzazione:** logo centrale (fino al 30%), colore del QR, colore di sfondo e risoluzione 300/500/800 px.
* 🖼️ **Logo con riquadro pulito:** l'area attorno al logo viene ripulita automaticamente per non rovinare la lettura del codice.
* 📶 **QR con Wi-Fi, vCard e contatti:** si scansiona e ci si connette senza digitare nulla.
* 📴 **Usabile offline:** interfaccia e librerie incluse nell'app, nessuna dipendenza da CDN.
* 📱 **Comportamento nativo:** zoom, selezione del testo e rimbalzo della pagina disattivati, splash unico con l'icona dell'app.
* 🔒 **Privacy totale:** nessun dato lascia il telefono.

---

## 📲 **Compatibilità**

| | |
|---|---|
| **Android** | 7.0 (Nougat) e successivi |
| **Versione minima** | API 24 |
| **Target SDK** | API 35 (Android 15) |
| **Package** | `com.simonecompany.generatoreqr` |
| **Architettura** | universale (arm, arm64, x86, x86_64) |

✅ Testato su dispositivo reale Android 8.0 (Samsung Galaxy A3 2017).

---

## 📥 **Installazione**

1. Scarica il file `app-debug.apk` da questa release.
2. Copialo sul telefono e aprilo.
3. Al primo avvio concedi il permesso di accesso all'archivio quando richiesto.
4. Premi **Scarica Immagine PNG**: l'immagine finisce nella galleria.

> Se Android blocca l'installazione, attiva **fonti sconosciute** per l'app che stai usando per aprire il file.

---

## 🔐 **Permessi richiesti**

| Permesso | Quando | A cosa serve |
|---|---|---|
| `WRITE_EXTERNAL_STORAGE` | fino ad Android 9 | Scrivere il PNG in `Immagini/Generatore-QR` |
| `READ_EXTERNAL_STORAGE` | fino ad Android 12L | Lettura delle immagini |
| `READ_MEDIA_IMAGES` | Android 13+ | Accesso alle immagini del dispositivo |
| `INTERNET` | sempre | Non richiesto: l'app funziona offline |

Il permesso viene chiesto **una sola volta** all'avvio. Se lo rifiuti l'app continua a funzionare e salva comunque il codice QR.

---

## 🧑‍💻 **Sviluppo**

```bash
npm install          # installa le dipendenze
npm run assets       # genera icone e splash da icon.svg
npm run apk          # compila l'APK di debug
npm run apk:release  # compila l'APK di release
```

Il sorgente web è in `App/index.html`, il plugin nativo che salva in galleria è `App/native/GallerySaverPlugin.java`.

---

## 🐛 **Bug noti**

* Nessuno segnalato al momento della pubblicazione.

---

<div align="center">

### ⭐ Se l'app ti è utile, lascia una stella ⭐

</div>
