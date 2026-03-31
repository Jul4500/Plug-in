import { Forms, General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

const { ScrollView, Text, View } = General;
const {
    FormSwitchRow,
    FormRow,
    FormSection,
    FormInput,
    FormIcon,
    FormDivider,
} = Forms;

// ─────────────────────────────────────────────────────────────────────────────
// Petit composant titre de section stylé
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
    return (
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 }}>
            <Text
                style={{
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: "#5865F2",
                    opacity: 0.9,
                }}
            >
                {label}
            </Text>
        </View>
    );
}

export default function Settings() {
    useProxy(storage);

    // Valeurs par défaut
    storage.enabled ??= false;
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
    storage.timestampMode ??= "elapsed"; // "elapsed" | "remaining"
    storage.customEndTime ??= "";
    storage.appId ??= "1234567890123456789";
    storage.type ??= 0; // 0=Playing, 1=Streaming, 2=Listening, 3=Watching, 5=Competing
    storage.streamUrl ??= "";

    const ACTIVITY_TYPES = [
        { label: "🎮  Playing", value: 0 },
        { label: "📡  Streaming", value: 1 },
        { label: "🎵  Listening to", value: 2 },
        { label: "📺  Watching", value: 3 },
        { label: "🏆  Competing in", value: 5 },
    ];

    return (
        <ScrollView>
            {/* ── TOGGLE PRINCIPAL ── */}
            <SectionHeader label="Statut" />
            <FormSection>
                <FormSwitchRow
                    label="Activer le Custom RPC"
                    subLabel={storage.enabled ? "✅ Votre présence est active" : "❌ Désactivé"}
                    leading={<FormIcon source={getAssetIDByName("ic_activity_24px")} />}
                    value={storage.enabled}
                    onValueChange={(v: boolean) => {
                        storage.enabled = v;
                        showToast(
                            v ? "Custom RPC activé !" : "Custom RPC désactivé.",
                            getAssetIDByName(v ? "Check" : "Small")
                        );
                    }}
                />
            </FormSection>

            {/* ── IDENTIFIANT APPLICATION ── */}
            <SectionHeader label="Application Discord" />
            <FormSection>
                <FormInput
                    title="Application ID"
                    placeholder="1234567890123456789"
                    value={storage.appId}
                    onChange={(v: string) => (storage.appId = v.trim())}
                />
                <FormDivider />
                {/* Type d'activité — sélection via rows cliquables */}
                <FormRow
                    label="Type d'activité"
                    subLabel={ACTIVITY_TYPES.find(t => t.value === storage.type)?.label ?? "Playing"}
                    leading={<FormIcon source={getAssetIDByName("ic_activity_24px")} />}
                    trailing={FormRow.Arrow}
                    onPress={() => {
                        // Cycle dans les types à chaque appui
                        const idx = ACTIVITY_TYPES.findIndex(t => t.value === storage.type);
                        const next = ACTIVITY_TYPES[(idx + 1) % ACTIVITY_TYPES.length];
                        storage.type = next.value;
                        showToast(`Type : ${next.label}`, getAssetIDByName("ic_activity_24px"));
                    }}
                />
                {storage.type === 1 && (
                    <>
                        <FormDivider />
                        <FormInput
                            title="URL du stream (Twitch / YouTube)"
                            placeholder="https://twitch.tv/tonpseudo"
                            value={storage.streamUrl}
                            onChange={(v: string) => (storage.streamUrl = v.trim())}
                        />
                    </>
                )}
            </FormSection>

            {/* ── TEXTES PRINCIPAUX ── */}
            <SectionHeader label="Textes" />
            <FormSection>
                <FormInput
                    title="Nom de l'activité"
                    placeholder="Mon jeu ou activité"
                    value={storage.name}
                    onChange={(v: string) => (storage.name = v)}
                />
                <FormDivider />
                <FormInput
                    title="Détails (ligne 1)"
                    placeholder="Ce que tu fais en ce moment"
                    value={storage.details}
                    onChange={(v: string) => (storage.details = v)}
                />
                <FormDivider />
                <FormInput
                    title="État (ligne 2)"
                    placeholder="Infos supplémentaires..."
                    value={storage.state}
                    onChange={(v: string) => (storage.state = v)}
                />
            </FormSection>

            {/* ── IMAGES ── */}
            <SectionHeader label="Images" />
            <FormSection>
                <FormInput
                    title="Grande image — clé ou URL"
                    placeholder="mp:external/xxxx ou nom_asset"
                    value={storage.largeImageKey}
                    onChange={(v: string) => (storage.largeImageKey = v.trim())}
                />
                <FormDivider />
                <FormInput
                    title="Grande image — tooltip"
                    placeholder="Texte au survol de la grande image"
                    value={storage.largeImageText}
                    onChange={(v: string) => (storage.largeImageText = v)}
                />
                <FormDivider />
                <FormInput
                    title="Petite image — clé ou URL"
                    placeholder="mp:external/xxxx ou nom_asset"
                    value={storage.smallImageKey}
                    onChange={(v: string) => (storage.smallImageKey = v.trim())}
                />
                <FormDivider />
                <FormInput
                    title="Petite image — tooltip"
                    placeholder="Texte au survol de la petite image"
                    value={storage.smallImageText}
                    onChange={(v: string) => (storage.smallImageText = v)}
                />
            </FormSection>

            {/* ── BOUTONS ── */}
            <SectionHeader label="Boutons (max 2)" />
            <FormSection>
                <FormInput
                    title="Bouton 1 — Label"
                    placeholder="Voir le site"
                    value={storage.button1Label}
                    onChange={(v: string) => (storage.button1Label = v)}
                />
                <FormDivider />
                <FormInput
                    title="Bouton 1 — URL"
                    placeholder="https://example.com"
                    value={storage.button1Url}
                    onChange={(v: string) => (storage.button1Url = v.trim())}
                />
                <FormDivider />
                <FormInput
                    title="Bouton 2 — Label"
                    placeholder="Rejoindre le Discord"
                    value={storage.button2Label}
                    onChange={(v: string) => (storage.button2Label = v)}
                />
                <FormDivider />
                <FormInput
                    title="Bouton 2 — URL"
                    placeholder="https://discord.gg/xxxxxxx"
                    value={storage.button2Url}
                    onChange={(v: string) => (storage.button2Url = v.trim())}
                />
            </FormSection>

            {/* ── TIMESTAMP ── */}
            <SectionHeader label="Horodatage" />
            <FormSection>
                <FormSwitchRow
                    label="Afficher le temps"
                    subLabel="Affiche un chrono sur la présence"
                    leading={<FormIcon source={getAssetIDByName("ic_clock")} />}
                    value={storage.showTimestamp}
                    onValueChange={(v: boolean) => (storage.showTimestamp = v)}
                />
                {storage.showTimestamp && (
                    <>
                        <FormDivider />
                        <FormRow
                            label="Mode du chrono"
                            subLabel={
                                storage.timestampMode === "elapsed"
                                    ? "⏱ Temps écoulé (depuis le lancement)"
                                    : "⏳ Temps restant (heure de fin personnalisée)"
                            }
                            leading={<FormIcon source={getAssetIDByName("ic_clock")} />}
                            trailing={FormRow.Arrow}
                            onPress={() => {
                                storage.timestampMode =
                                    storage.timestampMode === "elapsed" ? "remaining" : "elapsed";
                            }}
                        />
                        {storage.timestampMode === "remaining" && (
                            <>
                                <FormDivider />
                                <FormInput
                                    title="Heure de fin (timestamp Unix en ms)"
                                    placeholder="ex: 1712000000000"
                                    value={storage.customEndTime}
                                    onChange={(v: string) => (storage.customEndTime = v.trim())}
                                />
                            </>
                        )}
                    </>
                )}
            </FormSection>

            {/* ── ACTIONS RAPIDES ── */}
            <SectionHeader label="Actions rapides" />
            <FormSection>
                <FormRow
                    label="Réinitialiser tous les réglages"
                    subLabel="Remet tout à zéro"
                    leading={<FormIcon source={getAssetIDByName("ic_trash_24px")} />}
                    onPress={() => {
                        storage.enabled = false;
                        storage.name = "";
                        storage.details = "";
                        storage.state = "";
                        storage.largeImageKey = "";
                        storage.largeImageText = "";
                        storage.smallImageKey = "";
                        storage.smallImageText = "";
                        storage.button1Label = "";
                        storage.button1Url = "";
                        storage.button2Label = "";
                        storage.button2Url = "";
                        storage.showTimestamp = false;
                        storage.timestampMode = "elapsed";
                        storage.customEndTime = "";
                        storage.appId = "1234567890123456789";
                        storage.type = 0;
                        storage.streamUrl = "";
                        showToast("Réglages réinitialisés !", getAssetIDByName("ic_trash_24px"));
                    }}
                />
            </FormSection>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}
