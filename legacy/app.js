// BRUTAL BOX TIMER & DRILL GENERATOR - CORE ENGINE

// 1. ZÁLOŽNÍ DATABÁZE CVIČENÍ (fallback) - Použije se při lokálním spuštění bez serveru (CORS omezení)
const fallbackDatabase = {
    __README__: {
        info: "Tento soubor definuje databázi cvičení. Můžete přidávat vlastní položky do kategorií: warmup, combinations, bag_work, sparring, conditioning.",
        format_spec: {
            name: "Název cvičení (zobrazuje se na displeji, může obsahovat anglicismy/jména trenérů).",
            spokenName: "Český mluvený název (syntéza řeči ho čte v pauze, bez jmen trenérů a cizích slov).",
            coop: "Způsob spolupráce: 'najednou' (paralelně), 'stridave' (na střídačku v kole), 'v_pulce' (swap v půlce), 'celé_kolo' (jeden celé kolo, střídání v dalším).",
            voiceText: "Detailní český hlasový popis kombinace čtený v pauze.",
            type: "Určení typu: 'solo' (sólo), 'pair' (dvojice/skupina), 'any' (obojí)."
        }
    },
    warmup: [
        {
            name: "Skákání přes švihadlo (Klasická boxerská rozcvička)",
            spokenName: "Skákání přes švihadlo",
            coop: "najednou",
            voiceText: "Skákání přes švihadlo. Uvolněná ramena, lehké tempo.",
            type: "solo"
        },
        {
            name: "Angelo Dundee: Aliho stínový box s prací nohou",
            spokenName: "Stínový box z pohybu",
            coop: "najednou",
            voiceText: "Stínový box z pohybu. Lehký pohyb na špičkách, přední direkt z ústupu.",
            type: "any"
        },
        {
            name: "Boxing Jog & Punch (Běh na místě s direkty)",
            spokenName: "Běh na místě s údery",
            coop: "najednou",
            voiceText: "Běh na místě a rychlé direkty před sebe. Zvedej kolena.",
            type: "solo"
        },
        {
            name: "Cus D'Amato: Peek-a-boo rozcvička úhybů (Slip & Roll)",
            spokenName: "Rozcvička úhybů hlavou",
            coop: "najednou",
            voiceText: "Stínový box. Ruce u tváří, úhyby hlavou do stran a úhyby pod údery.",
            type: "any"
        }
    ],
    combinations: [
        {
            name: "Cus D'Amato: Peek-a-boo úhyb vlevo + Tysonův hák na spodek",
            spokenName: "Úhyb vlevo a přední hák",
            coop: "v_pulce",
            voiceText: "Úhyb vlevo, přední hák na tělo, přední hák na hlavu.",
            type: "any"
        },
        {
            name: "Cus D'Amato: Peek-a-boo slip & counter (Kombinace 7-1-2)",
            spokenName: "Úhyb vlevo, zvedák a hák",
            coop: "stridave",
            voiceText: "Úhyb vlevo, přední zvedák, zadní direkt, přední hák.",
            type: "any"
        },
        {
            name: "Freddie Roach: Pacquiao's 3-step pivot & hook",
            spokenName: "Úkrok do strany a přední hák",
            coop: "v_pulce",
            voiceText: "Přední, přední, zadní, rychlý úkrok do strany, přední hák.",
            type: "any"
        },
        {
            name: "Freddie Roach: Kontr proti jabu soupeře (Slip inside & counter)",
            spokenName: "Kontr po úhybu vpravo",
            coop: "v_pulce",
            voiceText: "Úhyb vpravo dovnitř úderu, zadní direkt na tělo, přední hák na hlavu.",
            type: "any"
        },
        {
            name: "Teddy Atlas: 'The Wall' (Jab - Cross - Roll - Pivot - Cross)",
            spokenName: "Úhyb pod hákem a úkrok",
            coop: "v_pulce",
            voiceText: "Přední, zadní, úhyb pod hákem, úkrok do strany, zadní direkt.",
            type: "any"
        },
        {
            name: "Angelo Dundee: Sugar Ray Leonard's triple hook",
            spokenName: "Úhyb pod hákem a dvojitý hák",
            coop: "v_pulce",
            voiceText: "Přední, zadní, úhyb pod hákem, přední hák na tělo, přední hák na hlavu.",
            type: "any"
        },
        {
            name: "Kronk Gym (Steward): Dlouhá 1-2 se zkrácením vzdálenosti",
            spokenName: "Dlouhé direkty s krokem vpřed",
            coop: "stridave",
            voiceText: "Dlouhý přední direkt, tvrdý zadní direkt s krokem vpřed.",
            type: "any"
        },
        {
            name: "Kronk Gym (Steward): 1-2 - Úskok vzad - 1-2",
            spokenName: "Direkty, úskok vzad a direkty",
            coop: "stridave",
            voiceText: "Přední, zadní, úskok vzad, přední, zadní.",
            type: "any"
        },
        {
            name: "Lapy ve dvojici: Roachův nácvik na reakci zvedáků",
            spokenName: "Nácvik reakce zvedáků",
            coop: "v_pulce",
            voiceText: "Přední hák, úhyb vpravo, zadní zvedák, přední hák.",
            type: "pair"
        },
        {
            name: "Lapy ve dvojici: Dundeeho nácvik kontrů",
            spokenName: "Nácvik kontrů na lapy",
            coop: "v_pulce",
            voiceText: "Jeden útočí zadním direktem, obránce dělá úhyb vlevo a vrací přední hák a zadní direkt.",
            type: "pair"
        }
    ],
    bag_work: [
        {
            name: "Kronk Gym: Těžký pytel - Hledání K.O. úderu",
            spokenName: "Práce na pytli, tvrdý direkt",
            coop: "najednou",
            voiceText: "Práce na pytli. Dlouhé údery z dálky, následované tvrdým zadním direktem.",
            type: "solo"
        },
        {
            name: "Cus D'Amato: Tysonův Peek-a-boo dril na pytli s úhyby",
            spokenName: "Práce na pytli s úhyby",
            coop: "najednou",
            voiceText: "Práce na pytli. Po každé kombinaci udělej dva úhyby hlavou.",
            type: "solo"
        },
        {
            name: "Freddie Roach: Rychlostní intervaly (Speed roll)",
            spokenName: "Rychlostní intervaly na pytli",
            coop: "najednou",
            voiceText: "Práce na pytli. Střídání deseti sekund rychlých úderů a dvaceti sekund lehkých úderů.",
            type: "solo"
        },
        {
            name: "Teddy Atlas: Pytel - Útok na spodek a zvedáky zblízka",
            spokenName: "Boj zblízka na pytli",
            coop: "najednou",
            voiceText: "Boj zblízka na pytli. Dvojitý kryt, zvedáky a háky na tělo.",
            type: "solo"
        },
        {
            name: "Angelo Dundee: Pyramida úderů na pytli (1 až 10)",
            spokenName: "Pyramida úderů",
            coop: "najednou",
            voiceText: "Pyramida úderů. Postupně zvyšuj počet úderů od jednoho do deseti a zpět dolů na jeden.",
            type: "solo"
        }
    ],
    sparring: [
        {
            name: "Angelo Dundee: Reflexní sparring 'Ali' (Lehce na hlavu)",
            spokenName: "Lehký sparring z pohybu",
            coop: "najednou",
            voiceText: "Uvolněný sparring. Práce z pohybu na špičkách, bez tvrdých úderů.",
            type: "pair"
        },
        {
            name: "Cus D'Amato: Peek-a-boo nácvik tlaku (Infight sparring)",
            spokenName: "Sparring v boji zblízka",
            coop: "najednou",
            voiceText: "Boj zblízka. Jeden tlačí dopředu schovaný v krytu, druhý ho drží na distanc.",
            type: "pair"
        },
        {
            name: "Freddie Roach: Podmíněný sparring na spodek (Body sparring)",
            spokenName: "Sparring na tělo",
            coop: "najednou",
            voiceText: "Sparring pouze na tělo. Kryj si žebra a břicho.",
            type: "pair"
        },
        {
            name: "Kronk Gym: Taktický sparring na přední ruku",
            spokenName: "Sparring pouze přední rukou",
            coop: "najednou",
            voiceText: "Sparring pouze přední rukou. Práce na distanc a přední direkt.",
            type: "pair"
        },
        {
            name: "Teddy Atlas: Bezkontaktní stínový sparring na vzdálenost",
            spokenName: "Stínový sparring ve dvojici",
            coop: "najednou",
            voiceText: "Stínový sparring ve dvojici bez doteku.",
            type: "any"
        }
    ],
    conditioning: [
        {
            name: "Cus D'Amato: Tysonovy sklapovačky s údery do stran",
            spokenName: "Sklapovačky s údery",
            coop: "najednou",
            voiceText: "Sklapovačky. Nahoře přidej rotaci a dva údery do vzduchu.",
            type: "any"
        },
        {
            name: "Kronk Gym: Házení těžkým medicimbalem o zem (Slams)",
            spokenName: "Házení medicimbalem o zem",
            coop: "najednou",
            voiceText: "Házení těžkým medicimbalem oběma rukama o zem. Zapoj břicho.",
            type: "any"
        },
        {
            name: "Angelo Dundee: Rychlostní boxerský stín s lehkými činkami",
            spokenName: "Stínový box s činkami",
            coop: "najednou",
            voiceText: "Stínový box s činkami. Rychlé direkty, ruce hned zpátky do krytu.",
            type: "any"
        },
        {
            name: "Freddie Roach: Angličáky s výskokem a boxerským dvojúderem",
            spokenName: "Angličáky s údery",
            coop: "najednou",
            voiceText: "Angličáky s výskokem a údery ve vzduchu při výskoku.",
            type: "any"
        },
        {
            name: "Teddy Atlas: 'The Gladiator Plank' (Plank s klikem)",
            spokenName: "Plank střídaný s klikem",
            coop: "najednou",
            voiceText: "Vzpor na předloktích a střídavé zvedání na dlaně do kliku. Zpevni střed těla.",
            type: "any"
        }
    ]
};

// Pomocná funkce pro vyčištění duplicit v databázi cvičení
function sanitizeDatabase(db) {
    if (!db) return db;
    const categories = ["warmup", "combinations", "bag_work", "sparring", "conditioning"];
    let removedCount = 0;
    
    categories.forEach(cat => {
        if (!Array.isArray(db[cat])) return;
        const seenNames = new Set();
        const seenVoiceTexts = new Set();
        const cleanList = [];
        
        db[cat].forEach(drill => {
            if (!drill || !drill.name) return;
            // Převést cvičení typu celé_kolo na v_pulce pro kategorii combinations
            if (cat === "combinations" && drill.coop === "celé_kolo") {
                drill.coop = "v_pulce";
                console.log(`Sanitized: Converted 'celé_kolo' drill "${drill.name}" to 'v_pulce' in combinations.`);
            }
            const nameKey = drill.name.trim().toLowerCase();
            const voiceKey = (drill.voiceText || "").trim().toLowerCase().replace(/[^a-záčďéěíňóřšťúůýž0-9 ]/g, "").replace(/\s+/g, " ");
            
            if (seenNames.has(nameKey) || (voiceKey && seenVoiceTexts.has(voiceKey))) {
                removedCount++;
                console.log(`Deduplicated: Removed duplicate drill "${drill.name}" from category "${cat}"`);
            } else {
                seenNames.add(nameKey);
                if (voiceKey) {
                    seenVoiceTexts.add(voiceKey);
                }
                cleanList.push(drill);
            }
        });
        db[cat] = cleanList;
    });
    
    if (removedCount > 0) {
        console.log(`Deduplication complete. Removed ${removedCount} duplicate(s).`);
    }
    return db;
}

// Globální databáze cvičení (načtená nebo fallback)
let drillDatabase = {};

// Stav aplikace
let selectedParticipants = 1;
let workoutDuration = 40; // výchozí v minutách
let standardRestDuration = 20; // výchozí pauza v sekundách
let generatedWorkout = []; // seznam segmentů tréninku
let currentSegmentIndex = -1;
let timerInterval = null;
let timeLeft = 0; // sekundy aktuálního segmentu
let isPaused = true;
let isMuted = false;
let subTimerInterval = null;
let currentSubCombination = "";
let hasSpokenCurrentSegment = false;
let hasPlayedBellCurrentSegment = false;

// Nastavení syntézy řeči
let voices = [];
let selectedVoice = null;

// Inicializace aplikace
document.addEventListener("DOMContentLoaded", () => {
    initParticipantsSelector();
    initDurationSlider();
    initRestDurationSlider();
    initSpeechSynthesis();
    loadDrillDatabase();
    
    // Nastavení tlačítek
    document.getElementById("btn-generate").addEventListener("click", generateAndSetupWorkout);
    document.getElementById("btn-play-pause").addEventListener("click", togglePlayPause);
    document.getElementById("btn-repeat").addEventListener("click", repeatInstruction);
    document.getElementById("btn-skip").addEventListener("click", skipSegment);
    document.getElementById("btn-reset").addEventListener("click", resetWorkoutToSetup);
    document.getElementById("btn-mute-speech").addEventListener("click", toggleSpeechMute);
});

// 2. NAČTENÍ DATABÁZE (localStorage / drills.json / fallback)
function loadDrillDatabase() {
    const saved = localStorage.getItem("brutal_box_drills");
    let needsUpdate = false;
    
    if (saved) {
        try {
            drillDatabase = sanitizeDatabase(JSON.parse(saved));
            // Zkontrolujeme, zda máme nejnovější verzi s formátem spolupráce (coop) a návodem (README)
            const hasCoop = drillDatabase.combinations && drillDatabase.combinations.some(d => d.coop !== undefined);
            const hasReadme = drillDatabase.__README__ !== undefined;
            if (!hasCoop || !hasReadme) {
                needsUpdate = true;
            } else {
                console.log("Databáze načtena z localStorage.");
                renderEditorList();
                return;
            }
        } catch (e) {
            console.error("Chyba při parsování localStorage:", e);
            needsUpdate = true;
        }
    }

    // Ochrana před chybou CORS (blokováno:původ) při lokálním spuštění z disku (file://)
    if (window.location.protocol === "file:") {
        console.log("Spuštěno lokálně (file://). Načítám integrovanou databázi.");
        drillDatabase = sanitizeDatabase(JSON.parse(JSON.stringify(fallbackDatabase))); // Deep copy fallbacku
        saveDatabaseLocally();
        renderEditorList();
        return;
    }

    // Pokus o stažení drills.json z FTP/serveru (pouze pro http/https)
    fetch("drills.json")
        .then(response => {
            if (!response.ok) throw new Error("Chyba při stahování drills.json");
            return response.json();
        })
        .then(data => {
            drillDatabase = sanitizeDatabase(data);
            console.log("Databáze načtena ze souboru drills.json.");
            saveDatabaseLocally();
            renderEditorList();
        })
        .catch(err => {
            console.warn("Nepodařilo se stáhnout drills.json. Používám integrovanou databázi.", err);
            drillDatabase = sanitizeDatabase(JSON.parse(JSON.stringify(fallbackDatabase))); // Deep copy fallbacku
            saveDatabaseLocally();
            renderEditorList();
        });
}

function saveDatabaseLocally() {
    localStorage.setItem("brutal_box_drills", JSON.stringify(drillDatabase));
}

// 3. OVLÁDACÍ PRVKY NASTAVENÍ
function initParticipantsSelector() {
    const selectorHelpTexts = {
        1: "Sólo trénink. Ideální pro pytel, stínový box a individuální kondici.",
        2: "Standardní dvojice. Klasická práce na lapách, párový nácvik a sparring.",
        3: "Tříčlenná skupina (Rotace). Dva cvičí spolu (lapy/sparring), třetí pracuje na pytli nebo odpočívá. Každé kolo rotují všichni zúčastnění.",
        4: "Dvě samostatné dvojice. Standardní párová práce a sparingy pro 4 lidi.",
        5: "Pětičlenná skupina (Rotace). Dvě dvojice cvičí nácviky/sparring, pátý pracuje na pytli. Každé kolo se střídají.",
        6: "Tři samostatné dvojice. Ideální rozdělení do tří klasických párů."
    };

    const buttons = document.querySelectorAll(".participants-selector .btn-selector");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedParticipants = parseInt(btn.getAttribute("data-val"), 10);
            
            // Aktualizace nápovědy
            document.getElementById("participants-help").textContent = selectorHelpTexts[selectedParticipants] || "";
        });
    });
}

function initDurationSlider() {
    const slider = document.getElementById("input-duration");
    const valDisplay = document.getElementById("val-duration");
    
    slider.addEventListener("input", (e) => {
        workoutDuration = parseInt(e.target.value, 10);
        valDisplay.textContent = workoutDuration;
    });
}

function initRestDurationSlider() {
    const slider = document.getElementById("input-rest-duration");
    const valDisplay = document.getElementById("val-rest-duration");
    
    if (slider && valDisplay) {
        // Nastavit výchozí hodnotu v JS z HTML elementu
        standardRestDuration = parseInt(slider.value, 10);
        valDisplay.textContent = standardRestDuration;
        
        slider.addEventListener("input", (e) => {
            standardRestDuration = parseInt(e.target.value, 10);
            valDisplay.textContent = standardRestDuration;
        });
    }
}

// 4. HLAS A ZVUKY (SpeechSynthesis & Web Audio API)
function initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
        console.warn("Tento prohlížeč nepodporuje syntézu řeči.");
        document.getElementById("chk-tts").checked = false;
        document.getElementById("chk-tts").disabled = true;
        return;
    }

    const loadVoices = () => {
        voices = window.speechSynthesis.getVoices();
        const voiceSelect = document.getElementById("select-voice");
        voiceSelect.innerHTML = "";
        
        // Najít české hlasy
        let czechVoices = voices.filter(v => v.lang.startsWith("cs"));
        
        // Seřadit hlasy, aby ty nejlepší (Online, Neural, Natural) byly nahoře
        czechVoices.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aGood = aName.includes("online") || aName.includes("natural") || aName.includes("neural");
            const bGood = bName.includes("online") || bName.includes("natural") || bName.includes("neural");
            if (aGood && !bGood) return -1;
            if (!aGood && bGood) return 1;
            return 0;
        });
        
        if (czechVoices.length > 0) {
            czechVoices.forEach((voice, index) => {
                const option = document.createElement("option");
                option.value = voice.name;
                // Přidat hezký štítek pro online/neural hlasy
                const isOnline = voice.name.toLowerCase().includes("online") || voice.name.toLowerCase().includes("natural");
                option.textContent = `${voice.name}${isOnline ? " ⚡ [Doporučeno]" : ""} (${voice.lang})`;
                if (index === 0) {
                    option.selected = true;
                    selectedVoice = voice;
                }
                voiceSelect.appendChild(option);
            });
        } else {
            // Pokud není specificky český hlas, nabídneme všechny, nebo výchozí systémový
            const option = document.createElement("option");
            option.value = "default";
            option.textContent = "Výchozí systémový hlas (pokusí se o češtinu)";
            voiceSelect.appendChild(option);
            
            // Zkusit najít aspoň nějaký hlas
            selectedVoice = voices.find(v => v.default) || null;
        }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    document.getElementById("select-voice").addEventListener("change", (e) => {
        const val = e.target.value;
        selectedVoice = voices.find(v => v.name === val) || voices.find(v => v.default) || null;
    });

    // Propojení sliderů s textovým zobrazením
    const sliderRate = document.getElementById("slider-rate");
    const valRate = document.getElementById("val-rate");
    if (sliderRate && valRate) {
        sliderRate.addEventListener("input", (e) => {
            valRate.textContent = e.target.value;
        });
    }

    const sliderPitch = document.getElementById("slider-pitch");
    const valPitch = document.getElementById("val-pitch");
    if (sliderPitch && valPitch) {
        sliderPitch.addEventListener("input", (e) => {
            valPitch.textContent = e.target.value;
        });
    }
}

function speak(text) {
    const useTTS = document.getElementById("chk-tts").checked;
    if (!useTTS || isMuted || !text || !('speechSynthesis' in window)) return;
    
    // Automatická oprava nepěkných slov pro čtení (např. "and" -> "a", "&" -> "a")
    text = text.replace(/&/g, " a ")
               .replace(/\band\b/gi, " a ")
               .replace(/\s+/g, " ")
               .trim();
    
    window.speechSynthesis.cancel(); // Zrušit předchozí hlášení, pokud ještě běží
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    
    // Hlasitost ze slideru
    const vol = parseFloat(document.getElementById("slider-volume").value);
    utterance.volume = isNaN(vol) ? 0.8 : vol;
    
    // Rychlost řeči ze slideru (výchozí 0.8)
    const rate = parseFloat(document.getElementById("slider-rate").value);
    utterance.rate = isNaN(rate) ? 0.8 : rate;
    
    // Výška hlasu ze slideru (výchozí 1.0)
    const pitch = parseFloat(document.getElementById("slider-pitch").value);
    utterance.pitch = isNaN(pitch) ? 1.0 : pitch;
    
    window.speechSynthesis.speak(utterance);
}

function toggleSpeechMute() {
    isMuted = !isMuted;
    const btn = document.getElementById("btn-mute-speech");
    if (isMuted) {
        btn.innerHTML = "🔇 Hlas je ztišený (kliknutím zapnete)";
        btn.classList.add("text-muted");
        window.speechSynthesis.cancel();
    } else {
        btn.innerHTML = "🔊 Hlas je zapnutý (kliknutím ztišíte)";
        btn.classList.remove("text-muted");
        speak("Hlas zapnut.");
    }
}

// Syntéza boxerského zvonu přes Web Audio API
function playBell(triplicate = false) {
    let AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    try {
        const ctx = new AudioContextClass();
        
        const playStrike = (time) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            // Zvonivý kovový zvuk se skládá z více frekvencí
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, time); // A5 tón
            
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1320, time); // Vyšší harmonická
            
            gainNode.gain.setValueAtTime(0.4, time);
            // Rychlý pokles simulující úder do kovového zvonu
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
            
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc1.start(time);
            osc2.start(time);
            
            osc1.stop(time + 1.2);
            osc2.stop(time + 1.2);
        };
        
        const now = ctx.currentTime;
        if (triplicate) {
            // Tři údery (start/konec celého tréninku)
            playStrike(now);
            playStrike(now + 0.3);
            playStrike(now + 0.6);
        } else {
            // Dva údery (běžný začátek/konec kola)
            playStrike(now);
            playStrike(now + 0.35);
        }
    } catch (e) {
        console.error("Nepodařilo se přehrát zvuk zvonu:", e);
    }
}

// Zvuk odpočtu (dřevěný klepač - woodblock)
function playTick() {
    let AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    try {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) { }
}

// 5. ALGORITMUS GENERÁTORU TRÉNINKU
function generateAndSetupWorkout() {
    // 1. Zjistit, které fáze jsou zapnuté
    const warmupEnabled = document.getElementById("chk-warmup").checked;
    const combinationsEnabled = document.getElementById("chk-combinations").checked;
    const bagEnabled = document.getElementById("chk-bag").checked;
    const sparringEnabled = document.getElementById("chk-sparring").checked;
    const conditioningEnabled = document.getElementById("chk-conditioning").checked;
    
    // Sjednocení kombinací a pytle, pokud jsou oba zapnuté
    const unifyCombsAndBag = combinationsEnabled && bagEnabled;
    
    // Vytvoříme seznam aktivních fází s jejich vahami
    let weights = {};
    if (warmupEnabled) weights.warmup = 0.15;
    
    if (unifyCombsAndBag) {
        weights.combinations_bag = 0.55; // sloučená váha (0.35 + 0.20)
    } else {
        if (combinationsEnabled) weights.combinations = 0.35;
        if (bagEnabled) weights.bag_work = 0.20;
    }
    
    if (sparringEnabled) weights.sparring = 0.15;
    if (conditioningEnabled) weights.conditioning = 0.15;
    
    const activePhases = Object.keys(weights);
    if (activePhases.length === 0) {
        alert("Musíte vybrat alespoň jednu fázi tréninku!");
        return;
    }
    
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    
    // Rozpočet v sekundách
    const totalWorkoutSec = workoutDuration * 60;
    generatedWorkout = [];
    
    // Začneme s krátkou přípravou
    generatedWorkout.push({
        phase: "prepare",
        name: "PŘÍPRAVA NA TRÉNINK",
        desc: `Připravte se na trénink. Počet lidí: ${selectedParticipants}.`,
        voiceText: `Trénink začíná. Připravte se.`,
        duration: 10,
        isRest: true
    });

    const usedDrillNames = new Set();
    let lastSelectedDrillName = null;

    let activeWorkRoundGlobalIndex = 0; // index všech pracovních kol pro výpočet rolí
    
    activePhases.forEach((phase, phaseIdx) => {
        // Cílový čas pro tuto fázi v sekundách
        const phaseTargetSec = (weights[phase] / totalWeight) * totalWorkoutSec;
        
        // Získat cvičení pro tuto fázi odpovídající počtu lidí
        const filteredDrills = getDrillsForCategoryAndPlayers(phase, selectedParticipants);
        
        if (filteredDrills.length === 0) {
            console.error(`Žádné drilly pro kategorii ${phase} a počet lidí ${selectedParticipants}.`);
            return;
        }

        // Definice kol a pauz podle fáze (nastavitelná pauza z posuvníku)
        let roundSec = 180; // 3 minuty
        let restSec = standardRestDuration; // standardní pauza (nácviky, pytel, sparring)
        
        if (phase === "warmup") {
            roundSec = 120; // 2 minuty rozcvička
            restSec = Math.max(10, Math.round(standardRestDuration * 0.75)); // rozcvičková pauza (např. 15s při 20s standardu)
        } else if (phase === "conditioning") {
            roundSec = 45;  // Tabata/kondiční intervaly (45s práce)
            restSec = Math.max(5, Math.round(standardRestDuration * 0.4));   // kondiční pauza (např. 8s při 20s standardu)
        } else if (phase === "sparring" && workoutDuration < 30) {
            roundSec = 120; // Kratší sparring pro kratší tréninky
        }

        let accumulatedSec = 0;
        let phaseSegments = [];
        
        let maxRounds = Infinity;
        if (phase === "warmup") maxRounds = 3;
        if (phase === "sparring") maxRounds = 4;
        
        while (accumulatedSec < phaseTargetSec && phaseSegments.filter(s => !s.isRest).length < maxRounds) {
            // Výběr unikátního cvičení v rámci fáze/tréninku
            let availableDrills = filteredDrills.filter(d => !usedDrillNames.has(d.name));
            if (availableDrills.length === 0) {
                // Pokud jsou všechna cvičení vyčerpána, resetujeme stav pro tuto fázi
                filteredDrills.forEach(d => usedDrillNames.delete(d.name));
                // Abychom se vyhnuli okamžitému opakování posledního cvičení, ponecháme ho v usedDrillNames, pokud je na výběr víc možností
                if (lastSelectedDrillName && filteredDrills.length > 1 && filteredDrills.some(d => d.name === lastSelectedDrillName)) {
                    usedDrillNames.add(lastSelectedDrillName);
                }
                availableDrills = filteredDrills.filter(d => !usedDrillNames.has(d.name));
                if (availableDrills.length === 0) {
                    availableDrills = [...filteredDrills];
                }
            }
            
            const shuffledAvailable = shuffleArray([...availableDrills]);
            const drill = shuffledAvailable[0];
            
            usedDrillNames.add(drill.name);
            lastSelectedDrillName = drill.name;
            
            // Určení počtu opakování pro cvičení typu celé_kolo
            let repeats = 1;
            if (selectedParticipants > 1 && drill.coop === "celé_kolo") {
                if (selectedParticipants === 3) repeats = 3;
                else if (selectedParticipants === 5) repeats = 5;
                else repeats = 2; // Dvojice (2, 4, 6)
            }
            
            for (let rep = 0; rep < repeats; rep++) {
                // Výpočet rolí
                const roles = getRolesForRound(activeWorkRoundGlobalIndex, selectedParticipants, phase, drill.coop);
                
                // Popis kola
                let description = drill.name;
                if ((phase === "combinations" || phase === "combinations_bag" || phase === "sparring") && (selectedParticipants === 3 || selectedParticipants === 5)) {
                    if (selectedParticipants === 3) {
                        description += " [Rotace 3 lidí: Boxer, Lapař, Pytel]";
                    } else if (selectedParticipants === 5) {
                        description += " [Rotace 5 lidí: 2 páry, pátý pytel]";
                    }
                }
                
                if (repeats > 1) {
                    description += ` (Část ${rep + 1}/${repeats})`;
                }
                
                let roundVoiceText = drill.voiceText;
                
                phaseSegments.push({
                    phase: phase,
                    name: drill.name,
                    spokenName: drill.spokenName || "",
                    coop: drill.coop,
                    desc: description,
                    voiceText: roundVoiceText,
                    duration: roundSec,
                    isRest: false,
                    roundNum: 1, // Bude opraveno níže
                    totalRoundsInPhase: 1, // Bude opraveno níže
                    subCombinations: (phase === "combinations" || phase === "combinations_bag") ? 
                        shuffleArray(filteredDrills.filter(d => d.name !== drill.name)).slice(0, 5).map(c => ({ name: c.name, voiceText: c.voiceText, spokenName: c.spokenName || "" })) : [],
                    roles: roles
                });
                
                // Přidáme-li sub-kombinace, ujistíme se, že první v poli je samotný hlavní drill
                const lastAdded = phaseSegments[phaseSegments.length - 1];
                if (lastAdded.subCombinations && lastAdded.subCombinations.length > 0) {
                    lastAdded.subCombinations.unshift({ name: drill.name, voiceText: drill.voiceText });
                }
                
                activeWorkRoundGlobalIndex++;
                accumulatedSec += roundSec;
                
                // Přidat pauzu za kolo
                phaseSegments.push({
                    phase: "rest",
                    name: "PAUZA / VYDÝCHÁNÍ",
                    desc: phase === "conditioning" ? "Rychlá pauza, připravte se na další cvik." : "Vydýchejte se, napijte se vody.",
                    voiceText: "Pauza.", // Dynamicky přepisováno v setSegment
                    duration: restSec,
                    isRest: true
                });
                accumulatedSec += restSec;
            }
        }
        
        // Zpětná korekce čísel kol a celkového počtu kol ve fázi
        const totalRounds = phaseSegments.filter(s => !s.isRest).length;
        let currentRoundNum = 1;
        phaseSegments.forEach(seg => {
            if (!seg.isRest) {
                seg.roundNum = currentRoundNum++;
                seg.totalRoundsInPhase = totalRounds;
            }
        });
        
        generatedWorkout.push(...phaseSegments);
    });

    // Odstranění přebytečné pauzy na konci před finish segmentem
    if (generatedWorkout.length > 0 && generatedWorkout[generatedWorkout.length - 1].isRest) {
        generatedWorkout.pop();
    }


    // Závěr tréninku
    generatedWorkout.push({
        phase: "finish",
        name: "TRÉNINK DOKONČEN",
        desc: "Skvělá práce! Trénink je úspěšně za vámi. Důkladně se protáhněte.",
        voiceText: "Trénink je u konce. Výborná práce šampióni! Konec tréninku.",
        duration: 5,
        isRest: true
    });

    // 3. Vykreslit časovou osu a přepnout panely
    renderTimeline();
    
    // Zobrazit panel časovače, skrýt nastavení
    document.getElementById("setup-panel").classList.add("hidden");
    document.getElementById("timer-panel").classList.remove("hidden");
    
    // Připravit první segment
    setSegment(0);
}

// Pomocná funkce pro rozřazení rolí v jednotlivých kolech
function getRolesForRound(roundIndex, playerCount, phase, coop) {
    if (playerCount === 1) return null;
    
    // Role určujeme pouze pro nácviky kombinací, práci na pytli (pokud je sjednocená) a sparring
    if (phase !== "combinations" && phase !== "combinations_bag" && phase !== "sparring") {
        return null;
    }
    
    // 2 lidé: střídání Boxer <-> Lapař
    if (playerCount === 2) {
        const p1 = "Člověk 1";
        const p2 = "Člověk 2";
        const isEven = (roundIndex % 2 === 0);
        const boxerStart = isEven ? p1 : p2;
        const laparStart = isEven ? p2 : p1;
        
        if (coop === "v_pulce") {
            return `🥊 <strong>1. půlka:</strong> ${boxerStart} (box) + ${laparStart} (lapy) &nbsp;|&nbsp; 🥊 <strong>2. půlka:</strong> ${laparStart} (box) + ${boxerStart} (lapy)`;
        } else {
            return `🥊 <strong>Boxer:</strong> ${boxerStart} &nbsp;|&nbsp; 🛡️ <strong>Lapař/Kryt:</strong> ${laparStart}`;
        }
    }
    
    // 3 lidé: cyklická rotace (Boxer, Lapař, Pytel/Stínový box)
    if (playerCount === 3) {
        const boxerIdx = roundIndex % 3;
        const laparIdx = (roundIndex + 1) % 3;
        const bagIdx = (roundIndex + 2) % 3;
        
        const b = `Člověk ${boxerIdx + 1}`;
        const l = `Člověk ${laparIdx + 1}`;
        const bag = `Člověk ${bagIdx + 1}`;
        
        if (coop === "v_pulce") {
            return `🥊 <strong>1. půlka:</strong> ${b} (box) + ${l} (lapy) &nbsp;|&nbsp; 🥊 <strong>2. půlka:</strong> ${l} (box) + ${b} (lapy) &nbsp;|&nbsp; 🎒 <strong>Pytel:</strong> ${bag}`;
        } else {
            return `🥊 <strong>Boxer:</strong> ${b} &nbsp;|&nbsp; 🛡️ <strong>Lapař:</strong> ${l} &nbsp;|&nbsp; 🎒 <strong>Pytel:</strong> ${bag}`;
        }
    }
    
    // 4 lidé: dvě dvojice, střídání rolí ve dvojicích
    if (playerCount === 4) {
        const isEven = (roundIndex % 2 === 0);
        const b1 = isEven ? "Člověk 1" : "Člověk 2";
        const l1 = isEven ? "Člověk 2" : "Člověk 1";
        const b2 = isEven ? "Člověk 3" : "Člověk 4";
        const l2 = isEven ? "Člověk 4" : "Člověk 3";
        
        if (coop === "v_pulce") {
            return `🥊 <strong>1. půlka Boxeři:</strong> ${b1}, ${b2} &nbsp;|&nbsp; 🥊 <strong>2. půlka Boxeři:</strong> ${l1}, ${l2}`;
        } else {
            return `🥊 <strong>Boxeři:</strong> ${b1}, ${b2} &nbsp;|&nbsp; 🛡️ <strong>Lapaři:</strong> ${l1}, ${l2}`;
        }
    }
    
    // 5 lidí: rotace (2x Boxer, 2x Lapař, 1x Pytel)
    if (playerCount === 5) {
        const b1Idx = roundIndex % 5;
        const l1Idx = (roundIndex + 1) % 5;
        const b2Idx = (roundIndex + 2) % 5;
        const l2Idx = (roundIndex + 3) % 5;
        const bagIdx = (roundIndex + 4) % 5;
        
        const b1 = `Člověk ${b1Idx + 1}`;
        const l1 = `Člověk ${l1Idx + 1}`;
        const b2 = `Člověk ${b2Idx + 1}`;
        const l2 = `Člověk ${l2Idx + 1}`;
        const bag = `Člověk ${bagIdx + 1}`;
        
        if (coop === "v_pulce") {
            return `🥊 <strong>1. půlka Boxeři:</strong> ${b1}, ${b2} &nbsp;|&nbsp; 🥊 <strong>2. půlka Boxeři:</strong> ${l1}, ${l2} &nbsp;|&nbsp; 🎒 <strong>Pytel:</strong> ${bag}`;
        } else {
            return `🥊 <strong>Boxeři:</strong> ${b1}, ${b2} &nbsp;|&nbsp; 🛡️ <strong>Lapaři:</strong> ${l1}, ${l2} &nbsp;|&nbsp; 🎒 <strong>Pytel:</strong> ${bag}`;
        }
    }
    
    // 6 lidí: tři dvojice, střídání rolí ve dvojicích
    if (playerCount === 6) {
        const isEven = (roundIndex % 2 === 0);
        const b1 = isEven ? "Člověk 1" : "Člověk 2";
        const l1 = isEven ? "Člověk 2" : "Člověk 1";
        const b2 = isEven ? "Člověk 3" : "Člověk 4";
        const l2 = isEven ? "Člověk 4" : "Člověk 3";
        const b3 = isEven ? "Člověk 5" : "Člověk 6";
        const l3 = isEven ? "Člověk 6" : "Člověk 5";
        
        if (coop === "v_pulce") {
            return `🥊 <strong>1. půlka Boxeři:</strong> ${b1}, ${b2}, ${b3} &nbsp;|&nbsp; 🥊 <strong>2. půlka Boxeři:</strong> ${l1}, ${l2}, ${l3}`;
        } else {
            return `🥊 <strong>Boxeři:</strong> ${b1}, ${b2}, ${b3} &nbsp;|&nbsp; 🛡️ <strong>Lapaři:</strong> ${l1}, ${l2}, ${l3}`;
        }
    }
    
    return null;
}

// Pomocná funkce pro filtr cvičení
function getDrillsForCategoryAndPlayers(category, playerCount) {
    if (category === "combinations_bag") {
        const combDrills = getDrillsForCategoryAndPlayers("combinations", playerCount);
        const bagDrills = getDrillsForCategoryAndPlayers("bag_work", playerCount);
        return [...combDrills, ...bagDrills];
    }

    const list = drillDatabase[category] || [];
    
    // Filtrování na základě typu a počtu lidí
    if (playerCount === 1) {
        // Sólo: pouze solo a any
        return list.filter(d => d.type === "solo" || d.type === "any");
    } else {
        // Více lidí: pair a any. Pokud je to bag_work nebo warmup, sneseme i solo cvičení, 
        // protože se buď střídají, nebo cvičí všichni na svých místech (např. švihadlo).
        if (category === "bag_work" || category === "warmup" || category === "conditioning") {
            return list;
        }
        // Pro kombinace a sparring preferujeme párová cvičení nebo 'any'
        return list.filter(d => d.type === "pair" || d.type === "any");
    }
}

// Zamíchání pole (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 6. VYKRESLENÍ A OVLÁDÁNÍ TIMELINU
function renderTimeline() {
    const listContainer = document.getElementById("timeline-list");
    listContainer.innerHTML = "";
    
    let totalSec = 0;
    let workSec = 0;
    let restSec = 0;
    
    let displayIndex = 1;

    generatedWorkout.forEach((seg, idx) => {
        totalSec += seg.duration;
        if (seg.isRest) {
            restSec += seg.duration;
        } else {
            workSec += seg.duration;
        }

        // Přeskočíme úvodní přípravu a závěrečný finish pro zjednodušení timeline výpisu, nebo je vykreslii lehce
        if (seg.phase === "prepare" || seg.phase === "finish") return;

        const item = document.createElement("div");
        item.className = `timeline-item ${seg.phase}`;
        item.id = `timeline-item-${idx}`;
        
        const indexSpan = document.createElement("span");
        indexSpan.className = "item-index";
        
        if (!seg.isRest) {
            indexSpan.textContent = displayIndex++;
        } else {
            indexSpan.textContent = "-";
        }
        
        const details = document.createElement("div");
        details.className = "item-details";
        
        const phaseName = document.createElement("div");
        phaseName.className = "item-phase-name";
        phaseName.textContent = getPhaseCzechName(seg.phase, seg.roundNum, seg.totalRoundsInPhase);
        
        const name = document.createElement("div");
        name.className = "item-name";
        name.textContent = seg.name;
        
        details.appendChild(phaseName);
        details.appendChild(name);
        
        // Zobrazit rozpis rolí přímo v přehledu v timeline
        if (seg.roles) {
            const rolesDiv = document.createElement("div");
            rolesDiv.className = "item-roles-timeline";
            rolesDiv.style.fontSize = "0.75rem";
            rolesDiv.style.color = "var(--color-warning)";
            rolesDiv.style.marginTop = "2px";
            rolesDiv.innerHTML = seg.roles;
            details.appendChild(rolesDiv);
        }
        
        const duration = document.createElement("span");
        duration.className = "item-duration";
        duration.textContent = formatTime(seg.duration);
        
        item.appendChild(indexSpan);
        item.appendChild(details);
        item.appendChild(duration);
        
        // Kliknutím na položku v timeline lze skočit na danou fázi
        item.addEventListener("click", () => {
            if (confirm("Chcete přejít na tuto fázi tréninku?")) {
                setSegment(idx);
            }
        });

        listContainer.appendChild(item);
    });

    // Aktualizace statistik v pravém panelu
    document.getElementById("summary-total-time").textContent = `${Math.round(totalSec / 60)} min`;
    document.getElementById("summary-work-time").textContent = `${Math.round(workSec / 60)} min`;
    document.getElementById("summary-rest-time").textContent = `${Math.round(restSec / 60)} min`;
}

function getPhaseCzechName(phase, roundNum, totalRounds) {
    const names = {
        warmup: "Rozcvička",
        combinations: "Kombinace a úhyby",
        bag_work: "Práce na pytli",
        combinations_bag: "Nácvik a pytel",
        sparring: "Sparring",
        conditioning: "Kondice",
        rest: "Pauza"
    };
    let base = names[phase] || phase;
    if (roundNum && totalRounds) {
        return `${base} (Kolo ${roundNum}/${totalRounds})`;
    }
    return base;
}

// Pomocná funkce pro získání zjednodušeného českého ohlášení
function getSpokenNameForDrill(drill) {
    if (!drill) return "";
    if (drill.spokenName && drill.spokenName.trim().length > 0) {
        return drill.spokenName.trim();
    }
    
    // Zkusíme vzít první větu z voiceText bez tečky/vykřičníku
    if (drill.voiceText) {
        const firstSentence = drill.voiceText.split(/[.!?]/)[0].trim();
        if (firstSentence && firstSentence.length > 0) {
            return firstSentence;
        }
    }
    
    // Fallback: očistíme jméno od prefixů trenérů a cizích jmen
    let clean = drill.name || "";
    clean = clean.replace(/^(Cus D'Amato|Angelo Dundee|Freddie Roach|Teddy Atlas|Kronk Gym\s*(?:\([^)]*\))?)\s*:\s*/i, "");
    return clean;
}

// Pomocná funkce pro získání českého popisu spolupráce
function getCoopInstruction(drill, playerCount, phase) {
    if (!drill || playerCount <= 1) return "";
    
    let coop = drill.coop;
    if (!coop) {
        // Fallback na základě fáze
        if (phase === "warmup" || phase === "conditioning" || phase === "sparring" || phase === "bag_work") {
            coop = "najednou";
        } else {
            coop = "v_pulce"; // výchozí pro kombinace
        }
    }
    
    if (coop === "najednou") {
        return "Cvičí všichni najednou.";
    } else if (coop === "stridave") {
        return "Cvičíte na střídačku.";
    } else if (coop === "v_pulce") {
        return "Na můj pokyn se prohodíte.";
    } else if (coop === "celé_kolo") {
        return "Jeden cvičí celé kolo, v dalším se otočíte.";
    }
    return "";
}

// 7. BĚH ČASOVAČE
function setSegment(index) {
    // Vyčistit předchozí interval sub-timeru
    if (subTimerInterval) {
        clearInterval(subTimerInterval);
        subTimerInterval = null;
    }

    currentSegmentIndex = index;
    if (currentSegmentIndex < 0 || currentSegmentIndex >= generatedWorkout.length) {
        resetWorkoutToSetup(true);
        return;
    }
    
    const seg = generatedWorkout[currentSegmentIndex];
    timeLeft = seg.duration;
    currentSubCombination = "";
    
    // Změna designu na základě stavu (práce vs pauza)
    const card = document.getElementById("timer-panel");
    card.className = "card timer-card"; // reset
    
    if (seg.phase === "prepare") {
        card.classList.add("state-prepare");
        document.getElementById("timer-phase").textContent = "Příprava";
    } else if (seg.isRest) {
        card.classList.add("state-rest");
        document.getElementById("timer-phase").textContent = "Pauza";
    } else {
        card.classList.add("state-work");
        document.getElementById("timer-phase").textContent = getPhaseCzechName(seg.phase, seg.roundNum, seg.totalRoundsInPhase);
    }
    
    // Textové info
    document.getElementById("exercise-name").textContent = seg.name;
    
    let displayDesc = seg.desc || "";
    const coopText = getCoopInstruction(seg, selectedParticipants, seg.phase);
    if (coopText && selectedParticipants > 1 && !seg.isRest && seg.phase !== "prepare" && seg.phase !== "finish") {
        displayDesc += ` | Pokyn: ${coopText}`;
    }
    document.getElementById("exercise-desc").textContent = displayDesc;
    
    // Zobrazení rolí
    const rolesBox = document.getElementById("timer-roles");
    if (seg.roles) {
        rolesBox.innerHTML = seg.roles;
        rolesBox.classList.remove("hidden");
    } else {
        rolesBox.classList.add("hidden");
        rolesBox.innerHTML = "";
    }
    
    // Kolo celkově
    let workRoundsCount = generatedWorkout.filter(s => !s.isRest && s.phase !== "prepare" && s.phase !== "finish").length;
    let currentWorkRoundIndex = 0;
    
    let activeWorkCount = 0;
    generatedWorkout.forEach((s, idx) => {
        if (!s.isRest && s.phase !== "prepare" && s.phase !== "finish") {
            activeWorkCount++;
            if (idx <= currentSegmentIndex) {
                currentWorkRoundIndex = activeWorkCount;
            }
        }
    });

    document.getElementById("current-round").textContent = currentWorkRoundIndex || 1;
    document.getElementById("total-rounds").textContent = workRoundsCount || 1;
    
    // Následující cvičení preview
    const nextSeg = generatedWorkout[currentSegmentIndex + 1];
    if (nextSeg) {
        let nextText = nextSeg.name;
        if (!nextSeg.isRest && nextSeg.phase) {
            nextText += ` (${getPhaseCzechName(nextSeg.phase, nextSeg.roundNum, nextSeg.totalRoundsInPhase)})`;
        }
        document.getElementById("next-exercise-name").textContent = nextText;
    } else {
        document.getElementById("next-exercise-name").textContent = "Konec tréninku";
    }
    
    // Aktualizovat vizuální stav v timeline
    document.querySelectorAll(".timeline-item").forEach(item => {
        item.classList.remove("active", "completed");
    });
    
    generatedWorkout.forEach((s, idx) => {
        const item = document.getElementById(`timeline-item-${idx}`);
        if (!item) return;
        if (idx < currentSegmentIndex) {
            item.classList.add("completed");
        } else if (idx === currentSegmentIndex) {
            item.classList.add("active");
            // Auto scroll k aktivnímu prvku v timeline
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    updateTimerDisplay();
    
    hasSpokenCurrentSegment = false;
    hasPlayedBellCurrentSegment = false;
    triggerSegmentAudio();
}

// Spustí zvon a hlasový pokyn pro aktuální segment, pokud již nebyly přehrány a časovač běží
function triggerSegmentAudio() {
    if (isPaused) return;
    
    const seg = generatedWorkout[currentSegmentIndex];
    if (!seg) return;
    
    // Přehrát zvon
    if (!hasPlayedBellCurrentSegment) {
        hasPlayedBellCurrentSegment = true;
        if (seg.phase === "prepare" || seg.phase === "finish") {
            playBell(true);
        } else if (!seg.isRest) {
            playBell(false);
        }
    }
    
    // Přečíst hlasový pokyn
    if (!hasSpokenCurrentSegment) {
        hasSpokenCurrentSegment = true;
        
        let voiceTextToSpeak = seg.voiceText;
        const nextSeg = generatedWorkout[currentSegmentIndex + 1];
        
        if (seg.isRest) {
            // V pauze přečteme nadcházející cvičení, detailní kombinaci a pokyny pro spolupráci, aby se stihli nachystat
            if (nextSeg && !nextSeg.isRest && nextSeg.phase !== "finish") {
                const spokenName = getSpokenNameForDrill(nextSeg);
                const voiceText = nextSeg.voiceText || "";
                const coopText = getCoopInstruction(nextSeg, selectedParticipants, nextSeg.phase);
                
                // Pro první segment (přípravu) vynecháme slovo "Pauza."
                const prefix = (currentSegmentIndex === 0) ? "Další kolo bude:" : "Pauza. Další kolo bude:";
                
                // Zamezení zdvojení, pokud mluvený název je začátkem popisu
                if (voiceText.toLowerCase().startsWith(spokenName.toLowerCase())) {
                    voiceTextToSpeak = `${prefix} ${voiceText} ${coopText}`;
                } else {
                    voiceTextToSpeak = `${prefix} ${spokenName}. ${voiceText} ${coopText}`;
                }
            } else {
                voiceTextToSpeak = (currentSegmentIndex === 0) ? "Připravte se." : "Pauza. Vydýchejte se.";
            }
        } else if (seg.phase !== "prepare" && seg.phase !== "finish") {
            // Při startu kola řekneme číslo kola, signál "Box!" a čistou kombinaci bez omáčky
            const roundWord = seg.phase === "conditioning" ? "Interval" : "Kolo";
            voiceTextToSpeak = `${roundWord} ${seg.roundNum}. Box! ${seg.voiceText || ""}`;
        }
        
        speak(voiceTextToSpeak);
    }
}

// Logika hlášení kombinací v průběhu kola
function startSubCombinationAnnouncer(subCombs) {
    // Spouští se každých 30 sekund a řekne novou kombinaci
    let currentIdx = 0;
    
    const announceNext = () => {
        if (isPaused) return;
        
        const comb = subCombs[currentIdx];
        currentSubCombination = comb.name;
        document.getElementById("exercise-name").textContent = comb.name;
        speak(comb.voiceText);
        
        currentIdx = (currentIdx + 1) % subCombs.length;
    };
    
    // První vyhlásit cca po 5 sekundách (aby stihl doznít úvodní hlas kola)
    setTimeout(() => {
        if (currentSegmentIndex !== -1 && 
            (generatedWorkout[currentSegmentIndex].phase === "combinations" || generatedWorkout[currentSegmentIndex].phase === "combinations_bag") && 
            !isPaused) {
            announceNext();
        }
    }, 4000);
    
    // Pak každých 30 sekund po celou dobu kola
    subTimerInterval = setInterval(() => {
        announceNext();
    }, 30000);
}

function updateTimerDisplay() {
    document.getElementById("timer-time").textContent = formatTime(timeLeft);
    
    // Pokrok bar
    const seg = generatedWorkout[currentSegmentIndex];
    if (seg) {
        const percent = (timeLeft / seg.duration) * 100;
        document.getElementById("timer-progress").style.width = `${percent}%`;
    }
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function togglePlayPause() {
    isPaused = !isPaused;
    
    const playIcon = document.querySelector("#btn-play-pause .play-icon");
    const pauseIcon = document.querySelector("#btn-play-pause .pause-icon");
    
    if (isPaused) {
        clearInterval(timerInterval);
        timerInterval = null;
        playIcon.classList.remove("hidden");
        pauseIcon.classList.add("hidden");
        window.speechSynthesis.pause();
    } else {
        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");
        
        // Zvláštní ošetření pro SpeechSynthesis (pokračovat nebo spustit znova)
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        
        // Spustit audio (zvon/řeč), pokud ještě nebylo přehráno v tomto segmentu
        triggerSegmentAudio();
        
        timerInterval = setInterval(timerTick, 1000);
    }
}

function timerTick() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
        
        // Posledních 5 sekund kola - zvuk klepání (odpočet)
        if (timeLeft <= 5 && timeLeft > 0) {
            playTick();
        }
        
        // PŮLKA KOLA - Zvukové a slovní upozornění na výměnu rolí
        const seg = generatedWorkout[currentSegmentIndex];
        if (seg && !seg.isRest && seg.phase !== "prepare" && seg.phase !== "finish" && seg.duration > 20) {
            const halfTime = Math.floor(seg.duration / 2);
            if (timeLeft === halfTime) {
                const coop = seg.coop || (seg.phase === "combinations" || seg.phase === "combinations_bag" ? "v_pulce" : "najednou");
                if (coop === "v_pulce" && selectedParticipants > 1) {
                    playBell(false); // dvojitý zvon
                    speak("Změna!");
                }
            }
        }
    } else {
        // Konec segmentu - pokud stále běží předčítání instrukcí (v pauze/přípravě), prodloužíme ji
        const seg = generatedWorkout[currentSegmentIndex];
        if (seg && seg.isRest && window.speechSynthesis && window.speechSynthesis.speaking) {
            return; // počkáme na doznění řeči (tento blok se spustí znovu za sekundu)
        }
        
        // Konec segmentu
        playBell(false); // ukončovací zvon
        
        // Krátká prodleva a přechod na další segment
        clearInterval(timerInterval);
        timerInterval = null;
        
        setTimeout(() => {
            setSegment(currentSegmentIndex + 1);
            if (!isPaused) {
                timerInterval = setInterval(timerTick, 1000);
            }
        }, 1000);
    }
}

function skipSegment() {
    if (currentSegmentIndex === -1) return;
    
    if (confirm("Chcete přeskočit tuto fázi/kolo?")) {
        setSegment(currentSegmentIndex + 1);
    }
}

function repeatInstruction() {
    if (currentSegmentIndex === -1) return;
    
    const seg = generatedWorkout[currentSegmentIndex];
    if (!seg) return;
    
    let voiceTextToSpeak = seg.voiceText;
    const nextSeg = generatedWorkout[currentSegmentIndex + 1];
    
    if (seg.isRest) {
        // V pauze přečteme nadcházející cvičení, detailní kombinaci a pokyny pro spolupráci, aby se stihli nachystat
        if (nextSeg && !nextSeg.isRest && nextSeg.phase !== "finish") {
            const spokenName = getSpokenNameForDrill(nextSeg);
            const voiceText = nextSeg.voiceText || "";
            const coopText = getCoopInstruction(nextSeg, selectedParticipants, nextSeg.phase);
            
            // Pro první segment (přípravu) vynecháme slovo "Pauza."
            const prefix = (currentSegmentIndex === 0) ? "Další kolo bude:" : "Pauza. Další kolo bude:";
            
            // Zamezení zdvojení, pokud mluvený název je začátkem popisu
            if (voiceText.toLowerCase().startsWith(spokenName.toLowerCase())) {
                voiceTextToSpeak = `${prefix} ${voiceText} ${coopText}`;
            } else {
                voiceTextToSpeak = `${prefix} ${spokenName}. ${voiceText} ${coopText}`;
            }
        } else {
            voiceTextToSpeak = (currentSegmentIndex === 0) ? "Připravte se." : "Pauza. Vydýchejte se.";
        }
    } else if (seg.phase !== "prepare" && seg.phase !== "finish") {
        // Při startu kola řekneme jen číslo kola a signál "Box!"
        const roundWord = seg.phase === "conditioning" ? "Interval" : "Kolo";
        voiceTextToSpeak = `${roundWord} ${seg.roundNum}. Box!`;
    }
    
    // Zrušit aktuálně probíhající syntézu a přečíst znovu (pozdrží automaticky spuštění kola na 00:00)
    window.speechSynthesis.cancel();
    speak(voiceTextToSpeak);
}

function resetWorkoutToSetup(bypassConfirm = false) {
    if (bypassConfirm || confirm("Chcete ukončit běžící trénink a vrátit se do nastavení?")) {
        clearInterval(timerInterval);
        timerInterval = null;
        if (subTimerInterval) {
            clearInterval(subTimerInterval);
            subTimerInterval = null;
        }
        
        window.speechSynthesis.cancel();
        
        isPaused = true;
        currentSegmentIndex = -1;
        hasSpokenCurrentSegment = false;
        hasPlayedBellCurrentSegment = false;
        
        // Změnit ikonu zpět na play
        document.querySelector("#btn-play-pause .play-icon").classList.remove("hidden");
        document.querySelector("#btn-play-pause .pause-icon").classList.add("hidden");
        
        // Zobrazit nastavení, skrýt časovač
        document.getElementById("setup-panel").classList.remove("hidden");
        document.getElementById("timer-panel").classList.add("hidden");
    }
}

// 8. EDITOR CVIČENÍ (Záložka 2)
function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`tab-${tabId}`).classList.add("active");
    document.getElementById(`btn-tab-${tabId}`).classList.add("active");
    
    if (tabId === "editor") {
        renderEditorList();
    }
}

function renderEditorList() {
    const filter = document.getElementById("filter-category").value;
    const tbody = document.getElementById("editor-drill-rows");
    tbody.innerHTML = "";
    
    const categories = filter === "all" 
        ? ["warmup", "combinations", "bag_work", "sparring", "conditioning"] 
        : [filter];
        
    categories.forEach(cat => {
        const drills = drillDatabase[cat] || [];
        
        drills.forEach((drill, idx) => {
            const tr = document.createElement("tr");
            
            // Název
            const tdName = document.createElement("td");
            tdName.innerHTML = `<strong>${drill.name}</strong><br><small style="color:var(--color-text-muted)">${getCategoryCzechName(cat)}</small>`;
            
            // Hlas
            const tdVoice = document.createElement("td");
            tdVoice.textContent = drill.voiceText || "-";
            
            // Typ badge
            const tdType = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = `badge badge-${drill.type}`;
            badge.textContent = drill.type === "any" ? "Všechny" : (drill.type === "solo" ? "Sólo" : "Dvojice");
            tdType.appendChild(badge);
            
            // Tlačítka Akce
            const tdActions = document.createElement("td");
            tdActions.className = "action-buttons";
            
            const btnEdit = document.createElement("button");
            btnEdit.innerHTML = "✏️";
            btnEdit.title = "Upravit";
            btnEdit.onclick = () => editDrill(cat, idx);
            
            const btnDelete = document.createElement("button");
            btnDelete.innerHTML = "❌";
            btnDelete.title = "Smazat";
            btnDelete.onclick = () => deleteDrill(cat, idx);
            
            tdActions.appendChild(btnEdit);
            tdActions.appendChild(btnDelete);
            
            tr.appendChild(tdName);
            tr.appendChild(tdVoice);
            tr.appendChild(tdType);
            tr.appendChild(tdActions);
            
            tbody.appendChild(tr);
        });
    });
}

function getCategoryCzechName(cat) {
    const names = {
        warmup: "Warm-up",
        combinations: "Kombinace",
        bag_work: "Pytel",
        sparring: "Sparring",
        conditioning: "Kondice"
    };
    return names[cat] || cat;
}

// Uložení cvičení z formuláře (Přidání i Editace)
function saveDrill(e) {
    e.preventDefault();
    
    const cat = document.getElementById("drill-category").value;
    const name = document.getElementById("drill-name").value.trim();
    const spokenName = document.getElementById("drill-spoken-name").value.trim();
    const coop = document.getElementById("drill-coop").value;
    const voiceText = document.getElementById("drill-voice").value.trim();
    const type = document.getElementById("drill-type").value;
    
    const editId = document.getElementById("edit-drill-id").value;
    const editCat = document.getElementById("edit-drill-category").value;

    const newDrill = { name, spokenName, coop, voiceText, type };

    // Kontrola duplicit
    if (drillDatabase[cat]) {
        const normalizedNewVoiceText = voiceText.toLowerCase().replace(/[^a-záčďéěíňóřšťúůýž0-9 ]/g, "").replace(/\s+/g, " ");
        const isDuplicate = drillDatabase[cat].some((d, idx) => {
            // Pokud editujeme, přeskočíme porovnání se sebou samým
            if (editId !== "" && editCat === cat && idx === parseInt(editId, 10)) {
                return false;
            }
            const normalizedExistingVoiceText = (d.voiceText || "").toLowerCase().replace(/[^a-záčďéěíňóřšťúůýž0-9 ]/g, "").replace(/\s+/g, " ");
            return d.name.toLowerCase() === name.toLowerCase() || (normalizedNewVoiceText && normalizedExistingVoiceText === normalizedNewVoiceText);
        });

        if (isDuplicate) {
            if (!confirm("Varování: Cvičení se stejným názvem nebo popisem kombinace v této kategorii již existuje. Chcete jej přesto uložit?")) {
                return;
            }
        }
    }

    if (!drillDatabase[cat]) {
        drillDatabase[cat] = [];
    }

    if (editId !== "") {
        // Jde o úpravu stávajícího
        const idx = parseInt(editId, 10);
        if (editCat === cat) {
            // Kategorie zůstala stejná
            drillDatabase[cat][idx] = newDrill;
        } else {
            // Kategorie se změnila, smažeme ze staré a přidáme do nové
            drillDatabase[editCat].splice(idx, 1);
            drillDatabase[cat].push(newDrill);
        }
    } else {
        // Jde o nové cvičení
        drillDatabase[cat].push(newDrill);
    }
    
    saveDatabaseLocally();
    resetDrillForm();
    renderEditorList();
    alert("Cvičení bylo úspěšně uloženo.");
}

function editDrill(category, index) {
    const drill = drillDatabase[category][index];
    if (!drill) return;
    
    document.getElementById("edit-drill-id").value = index;
    document.getElementById("edit-drill-category").value = category;
    
    document.getElementById("drill-category").value = category;
    document.getElementById("drill-name").value = drill.name;
    document.getElementById("drill-spoken-name").value = drill.spokenName || "";
    document.getElementById("drill-coop").value = drill.coop || (category === "combinations" || category === "combinations_bag" ? "v_pulce" : "najednou");
    document.getElementById("drill-voice").value = drill.voiceText || "";
    document.getElementById("drill-type").value = drill.type || "any";
    
    document.getElementById("btn-save-drill").textContent = "Aktualizovat cvičení";
    
    // Scrollnout na formulář
    document.getElementById("drill-form").scrollIntoView({ behavior: 'smooth' });
}

function deleteDrill(category, index) {
    if (confirm(`Opravdu chcete smazat cvičení "${drillDatabase[category][index].name}"?`)) {
        drillDatabase[category].splice(index, 1);
        saveDatabaseLocally();
        renderEditorList();
    }
}

function resetDrillForm() {
    document.getElementById("edit-drill-id").value = "";
    document.getElementById("edit-drill-category").value = "";
    document.getElementById("drill-form").reset();
    document.getElementById("btn-save-drill").textContent = "Uložit cvičení";
}

// Hromadný import cvičení
function handleBulkImport() {
    const category = document.getElementById("bulk-category").value;
    const text = document.getElementById("bulk-text").value.trim();
    
    if (!text) {
        alert("Zadejte nějaký text k importu.");
        return;
    }
    
    const lines = text.split("\n");
    let addedCount = 0;
    
    if (!drillDatabase[category]) {
        drillDatabase[category] = [];
    }
    
    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        
        let name = cleanLine;
        let voiceText = cleanLine;
        
        // Zkusit rozdělit podle svislítka |
        if (cleanLine.includes("|")) {
            const parts = cleanLine.split("|");
            name = parts[0].trim();
            voiceText = parts[1].trim();
        }
        
        drillDatabase[category].push({
            name: name,
            spokenName: "",
            coop: (category === "combinations" || category === "combinations_bag") ? "v_pulce" : "najednou",
            voiceText: voiceText,
            type: "any"
        });
        addedCount++;
    });
    
    saveDatabaseLocally();
    renderEditorList();
    document.getElementById("bulk-text").value = "";
    alert(`Úspěšně naimportováno ${addedCount} cvičení do kategorie ${getCategoryCzechName(category)}.`);
}

// 9. EXPORT A IMPORT SOUBORU drills.json
function downloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(drillDatabase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "drills.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function uploadJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const uploadedDb = JSON.parse(evt.target.result);
            
            // Rychlá validace struktury
            const requiredKeys = ["warmup", "combinations", "bag_work", "sparring", "conditioning"];
            const hasAllKeys = requiredKeys.every(key => Array.isArray(uploadedDb[key]));
            
            if (!hasAllKeys) {
                throw new Error("Nahraný soubor nemá požadovanou strukturu (chybí některé kategorie nebo nejsou polem).");
            }
            
            if (confirm("Tímto přepíšete stávající databázi cvičení. Chcete pokračovat?")) {
                drillDatabase = sanitizeDatabase(uploadedDb);
                saveDatabaseLocally();
                renderEditorList();
                alert("Databáze cvičení byla úspěšně nahrána a uložena.");
            }
        } catch (err) {
            alert("Chyba při načítání souboru JSON: " + err.message);
        }
    };
    reader.readAsText(file);
}
