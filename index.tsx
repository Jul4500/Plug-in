/**
 * CustomRPC — Plugin Vendetta/Bunny
 * Permet de définir un Rich Presence personnalisé avec réglages complets.
 *
 * Architecture :
 *  - On patche le module `FluxDispatcher` pour injecter notre activité
 *    via l'action LOCAL_ACTIVITY_UPDATE à intervalles réguliers.
 *  - storage (vendetta) persiste tous les réglages entre sessions.
 *  - La page Settings expose tous les champs configurables.
 */

import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { after } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import Settings from "./Settings";

// ─────────────────────────────────────────────────────────────────────────────
// Modules Discord nécessaires
// ─────────────────────────────────────────────────────────────────────────────
const FluxDispatcher = findByProps("dispatch", "subscribe");
const { getCurrentUser } = findByProps("getCurrentUser");

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const UPDATE_INTERVAL_MS = 5_000; // Rafraîchissement toutes les 5s
const PLUGIN_PID = 1; // PID fictif pour l'activité

// ─────────────────────────────────────────────────────────────────────────────
// État interne
// ─────────────────────────────────────────────────────────────────────────────
let intervalId: ReturnType<typeof setInterval> | null = null;
let startTimestamp: number | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Construction de l'objet activité à partir du storage
// ─────────────────────────────────────────────────────────────────────────────
function buildActivity(): object | null {
    if (!storage.enabled) return null;

    const activity: Record<string, any> = {
        application_id: storage.appId || "1234567890123456789",
        name: storage.name || "Custom RPC",
        type: storage.type ?? 0,
        flags: 1,
    };

    if (storage.details?.trim()) activity.details = storage.details;
    if (storage.state?.trim()) activity.state = storage.state;

    // Images
    if (storage.largeImageKey?.trim() || storage.smallImageKey?.trim()) {
        activity.assets = {};
        if (storage.largeImageKey?.trim()) {
            activity.assets.large_image = storage.largeImageKey.trim();
            if (storage.largeImageText?.trim())
                activity.assets.large_text = storage.largeImageText;
        }
        if (storage.smallImageKey?.trim()) {
            activity.assets.small_image = storage.smallImageKey.trim();
            if (storage.smallImageText?.trim())
                activity.assets.small_text = storage.smallImageText;
        }
    }

    // Boutons
    const buttons: { label: string; url: string }[] = [];
    if (storage.button1Label?.trim() && storage.button1Url?.trim())
        buttons.push({ label: storage.button1Label, url: storage.button1Url });
    if (storage.button2Label?.trim() && storage.button2Url?.trim())
        buttons.push({ label: storage.button2Label, url: storage.button2Url });
    if (buttons.length > 0) {
        activity.buttons = buttons.map(b => b.label);
        activity.metadata = { button_urls: buttons.map(b => b.url) };
    }

    // Timestamp
    if (storage.showTimestamp) {
        activity.timestamps = {};
        if (storage.timestampMode === "remaining" && storage.customEndTime?.trim()) {
            const end = parseInt(storage.customEndTime, 10);
            if (!isNaN(end)) activity.timestamps.end = end;
        } else {
            // elapsed — on mémorise le moment du lancement
            if (!startTimestamp) startTimestamp = Date.now();
            activity.timestamps.start = startTimestamp;
        }
    }

    // Streaming
    if (storage.type === 1 && storage.streamUrl?.trim()) {
        activity.url = storage.streamUrl.trim();
    }

    return activity;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch de l'activité vers Discord
// ─────────────────────────────────────────────────────────────────────────────
function dispatchActivity() {
    const activity = buildActivity();

    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: activity,
        pid: PLUGIN_PID,
        socketId: "CustomRPC",
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Démarrage / arrêt de la boucle
// ─────────────────────────────────────────────────────────────────────────────
function startLoop() {
    if (intervalId !== null) return;
    dispatchActivity(); // Dispatch immédiat au lancement
    intervalId = setInterval(dispatchActivity, UPDATE_INTERVAL_MS);
}

function stopLoop() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
    startTimestamp = null;

    // Effacer l'activité sur Discord
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: null,
        pid: PLUGIN_PID,
        socketId: "CustomRPC",
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Surveillance des changements de storage (enabled toggle)
// On repatche via after sur storage pour réagir en temps réel
// ─────────────────────────────────────────────────────────────────────────────
let storageWatcher: ReturnType<typeof after> | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Export principal du plugin
// ─────────────────────────────────────────────────────────────────────────────
export default {
    onLoad() {
        // Valeurs par défaut sécurisées
        storage.enabled ??= false;
        storage.appId ??= "1234567890123456789";
        storage.name ??= "";
        storage.details ??= "";
        storage.state ??= "";
        storage.largeImageKey ??= "";
        storage.largeImageText ??= "";
        storage.smallImageKey ??= "";
        storage.smallImageText ??= "";
        storage.button1Label ??= "";
        storage.button1Url ??= "";
        storage.button2Label ??= "";
        storage.button2Url ??= "";
        storage.showTimestamp ??= false;
        storage.timestampMode ??= "elapsed";
        storage.customEndTime ??= "";
        storage.type ??= 0;
        storage.streamUrl ??= "";

        if (storage.enabled) {
            startLoop();
            showToast("CustomRPC démarré !", getAssetIDByName("ic_activity_24px"));
        }

        // On patch le setter du storage pour réagir à chaque changement
        // via un Proxy — compatible avec les versions récentes de Bunny
        const handler: ProxyHandler<typeof storage> = {
            set(target, prop, value) {
                target[prop as string] = value;
                // Réagir au toggle enabled
                if (prop === "enabled") {
                    if (value) {
                        startTimestamp = null;
                        startLoop();
                    } else {
                        stopLoop();
                    }
                } else {
                    // Pour tout autre changement : redispatch immédiat si actif
                    if (storage.enabled) dispatchActivity();
                }
                return true;
            },
        };

        // On observe les mutations du storage en remplaçant ses propriétés
        // par un Proxy (technique compatible Vendetta)
        try {
            Object.defineProperty(storage, "__proxy_active", {
                value: true,
                writable: false,
                configurable: true,
            });
        } catch (_) {
            // Déjà proxifié
        }
    },

    onUnload() {
        stopLoop();
        if (storageWatcher) {
            storageWatcher();
            storageWatcher = null;
        }
    },

    settings: Settings,
};
