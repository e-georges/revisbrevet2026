// ==========================================================================
// RévisBrevet 2026 — app.js (VERSION FINALE ULTRA-EVOLUTIVE MULTIMODALE)
// ==========================================================================

const AppState = {
  data: null,
  progress: {},
  adaptive: {}, 
  historiqueQuestions: [],
  targetMatiereIdForAdd: null,
  extractedOcrText: "",
  quiz: {
    chapitreId: null,
    questions: [],
    idx: 0,
    score: 0,
    isAutomatisme: false,
    niveauFiltre: 1,
    isCustomIA: false
  }
};

const $ = id => document.getElementById(id);

// Catalogue de base étendu au programme de Seconde
const DATA_INITIALE = {
  matieres: [
    {
      id: "maths",
      label: "Mathématiques",
      categorie: "🎓 CYCLES BREVET DES COLLÈGES",
      chapitres: [
        {
          id: "fractions",
          titre: "Calculs avec des fractions",
          theme: "Nombres",
          cours: "Pour additionner ou soustraire deux fractions, il faut les mettre au même dénominateur. Pour multiplier, on multiplie les numérateurs entre eux et les dénominateurs entre eux.",
          piege: "Oublier la priorité opératoire de la multiplication sur l'addition !"
        }
      ]
    },
    {
      id: "maths_2de",
      label: "Mathématiques (Lycée)",
      categorie: "🚀 OBJECTIF SECONDE",
      chapitres: [
        {
          id: "intervalles",
          titre: "Ensembles de nombres & Intervalles",
          theme: "Algèbre",
          cours: "En Seconde, on étudie les ensembles : ℕ (naturels), ℤ (relatifs), 𝔻 (décimaux), ℚ (rationnels) et ℝ (réels).\nUn intervalle [a ; b] rassemble les réels x vérifiant a ≤ x ≤ b.",
          piege: "Crochet ouvert veut dire valeur strictement exclue !"
        }
      ]
    }
  ]
};

const SVGMappings = {
  "maths": `<svg viewBox="0 0 24 24"><path d="M22 10v4h-6v6h-4v-6H6v-4h6V4h4v6h6z"/></svg>`,
  "maths_2de": `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
};

// Algorithme Anti-Répétition
function obtenirQuestionsFiltrees(pool, quantite) {
  let questionsDisponibles = pool.filter(q => !AppState.historiqueQuestions.includes(q.enonce));
  if (questionsDisponibles.length < quantite) {
    AppState.historiqueQuestions = AppState.historiqueQuestions.filter(enonce => !pool.some(q => q.enonce === enonce));
    questionsDisponibles = pool;
  }
  const selectionnees = shuffleArr(questionsDisponibles).slice(0, quantite);
  selectionnees.forEach(q => AppState.historiqueQuestions.push(q.enonce));
  if (AppState.historiqueQuestions.length > 50) AppState.historiqueQuestions.shift();
  localStorage.setItem('dnb_history_anti_repeat', JSON.stringify(AppState.historiqueQuestions));
  return selectionnees;
}

// 🎰 MOTEUR DE MUTATION INFINIE POUR LES MATHS ET LES DOSSIERS PERSO
function genererMutationMathsAleatoire(themeDonne) {
  const variableA = Math.floor(Math.random() * 20) + 2;
  const variableB = Math.floor(Math.random() * 15) + 2;
  const variableC = variableA * variableB;
  
  // Scénario A : Pourcentages / Évolution (Seconde)
  if (Math.random() > 0.5) {
    const taux = [5, 10, 20, 25, 50, 75][Math.floor(Math.random() * 6)];
    const base = [40, 80, 120, 200, 300, 500][Math.floor(Math.random() * 6)];
    const calcul = parseFloat(((taux * base) / 100).toFixed(2));
    
    return {
      enonce: `[Exercice Unique] Appliquer une évolution de ${taux}% sur une valeur de ${base} unités. Quelle est la valeur finale obtenue ?`,
      options: [`${calcul} unités`, `${base - calcul} unités`, `${base + calcul} unités`, `${calcul * 2} unités`],
      bonne_reponse: 0,
      explication: `Prendre ${taux}% de ${base} revient à faire (${taux} × ${base}) / 100 = ${calcul}.`
    };
  } 
  // Scénario B : Équations / Fondements
  else {
    return {
      enonce: `[Exercice Unique] Résoudre l'équation suivante : ${variableA}x = ${variableC}. Quelle est la valeur exacte de x ?`,
      options: [`x = ${variableB + 4}`, `x = ${variableB}`, `x = ${variableC}`, `x = ${variableA}`],
      bonne_reponse: 1,
      explication: `On isole x en effectuant l'opération inverse : x = ${variableC} / ${variableA} = ${variableB}.`
    };
  }
}

// ⏱️ GESTION DU CHRONOMÈTRE
let timerInterval = null;
let tempsRestant = 45;

function lancerTimer() {
  clearInterval(timerInterval);
  tempsRestant = 45;
  $('quiz-timer').style.display = 'inline-flex';
  $('quiz-timer').textContent = `⏱️ ${tempsRestant}s`;
  $('quiz-timer').style.background = '#E2E8F0';
  $('quiz-timer').style.color = 'var(--text-primary)';

  timerInterval = setInterval(() => {
    tempsRestant--;
    $('quiz-timer').textContent = `⏱️ ${tempsRestant}s`;
    if (tempsRestant <= 10) {
      $('quiz-timer').style.background = '#FEE2E2';
      $('quiz-timer').style.color = 'var(--color-danger)';
    }
    if (tempsRestant <= 0) {
      clearInterval(timerInterval);
      forcerEchecTimeout();
    }
  }, 1000);
}

function forcerEchecTimeout() {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  $('quiz-explanation-box').className = "explanation-box visible bad";
  $('explanation-status').textContent = "⏰ TEMPS ÉCOULÉ !";
  $('explanation-text').textContent = "Le temps réglementaire pour valider cet automatisme est dépassé.";
  $('quiz-next').disabled = false;
  enregistrerLacune("Automatismes");
}

function enregistrerLacune(theme, estSucces = false) {
  if (!AppState.adaptive[theme]) AppState.adaptive[theme] = { echecs: 0, total: 0 };
  AppState.adaptive[theme].total++;
  if (!estSucces) AppState.adaptive[theme].echecs++;
  localStorage.setItem('dnb_adaptive_analytics', JSON.stringify(AppState.adaptive));
  analyserLacunes();
}

function analyserLacunes() {
  let pireTheme = null;
  let maxEchecs = 0;
  for (const theme in AppState.adaptive) {
    const stat = AppState.adaptive[theme];
    if (stat.echecs > maxEchecs && (stat.echecs / stat.total) >= 0.35) {
      maxEchecs = stat.echecs;
      pireTheme = theme;
    }
  }
  if (pireTheme) {
    $('lacunes-box').classList.remove('hidden');
    $('lacunes-text').innerHTML = `💡 <b>Focus Recommandé :</b> Tu as commis des erreurs répétées sur le thème <b>${pireTheme}</b>. Utilise les Flashcards pour consolider ce point précis.`;
  } else {
    $('lacunes-box').classList.add('hidden');
  }
}

// 🚀 ENTRÉE DE L'APPLICATION
async function initialiserApp() {
  const savedData = localStorage.getItem('dnb_custom_curriculum');
  AppState.data = savedData ? JSON.parse(savedData) : DATA_INITIALE;

  const savedAdaptive = localStorage.getItem('dnb_adaptive_analytics');
  if (savedAdaptive) AppState.adaptive = JSON.parse(savedAdaptive);
  
  const savedHistory = localStorage.getItem('dnb_history_anti_repeat');
  if (savedHistory) AppState.historiqueQuestions = JSON.parse(savedHistory);
  
  construireMenuMatieres();
  analyserLacunes();
  configurerFlashcardsMenu();
  configurerOcrEvents();
}

function construireMenuMatieres() {
  const container = $('matieres-container');
  if (!container) return;
  container.innerHTML = "";
  
  const groupes = {};
  AppState.data.matieres.forEach(m => {
    const cat = m.categorie || "Général";
    if (!groupes[cat]) groupes[cat] = [];
    groupes[cat].push(m);
  });

  for (const [nomCategorie, listeMatieres] of Object.entries(groupes)) {
    const titreCategorie = document.createElement('div');
    titreCategorie.className = 'category-group-title';
    titreCategorie.textContent = nomCategorie;
    container.appendChild(titreCategorie);

    listeMatieres.forEach(m => {
      const card = document.createElement('div');
      card.className = 'card matiere-card-wrapper';
      
      const header = document.createElement('div');
      header.className = 'matiere-trigger-header';
      
      const defaultIcon = `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
      const svgIcon = SVGMappings[m.id] || defaultIcon;

      header.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="header-icon-box">${svgIcon}</div>
          <h3 style="margin:0; font-size:1rem; font-weight:700; color:var(--text-primary);">${m.label}</h3>
        </div>
        <svg class="arrow-indicator" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      `;
      
      const bodyContent = document.createElement('div');
      bodyContent.className = 'matiere-chapters-body';
      
      if (m.chapitres && m.chapitres.length > 0) {
        m.chapitres.forEach(c => {
          const row = document.createElement('div');
          row.className = 'chapitre-item';
          row.style.cssText = "padding:16px 14px; margin-top:12px; background:var(--bg-card); border-radius:12px; display:flex; justify-content:space-between; align-items:center; box-shadow: var(--shadow-sm);";
          row.onclick = (e) => ouvrirPreQuiz(m.id, c.id, e);
          row.innerHTML = `
            <span style="font-weight:600; font-size:.88rem; color:var(--text-primary);">${c.titre}</span>
            <span style="font-size:.65rem; font-weight:700; color:var(--color-primary); background:#EEF2FF; padding:4px 8px; border-radius:6px; text-transform:uppercase;">${c.theme || 'Perso'}</span>
          `;
          bodyContent.appendChild(row);
        });
      }

      // Bouton Évolutif "Ajouter un chapitre" intégré de manière transparente
      const btnAdd = document.createElement('button');
      btnAdd.className = "btn-secondary";
      btnAdd.style.cssText = "margin-top:14px; min-height:42px; font-size:0.82rem; border-radius:10px; background:#F1F5F9; color:var(--color-primary); width:100%; font-weight:700;";
      btnAdd.textContent = "＋ Ajouter un chapitre manuel / photo";
      btnAdd.onclick = (e) => {
        e.stopPropagation();
        openAddChapterModal(m.id);
      };
      bodyContent.appendChild(btnAdd);

      header.onclick = () => {
        const estOuvert = bodyContent.classList.contains('is-open');
        document.querySelectorAll('.matiere-chapters-body').forEach(b => b.classList.remove('is-open'));
        document.querySelectorAll('.arrow-indicator').forEach(a => a.classList.remove('rotated'));
        if (!estOuvert) {
          bodyContent.classList.add('is-open');
          header.querySelector('.arrow-indicator').classList.add('rotated');
        }
      };

      card.appendChild(header);
      card.appendChild(bodyContent);
      container.appendChild(card);
    });
  }
}

let currentMatiereSelected = null;
let currentChapitreSelected = null;

function ouvrirPreQuiz(matiereId, chapitreId, event) {
  if (event) event.stopPropagation();
  
  currentMatiereSelected = AppState.data.matieres.find(m => m.id === matiereId);
  currentChapitreSelected = currentMatiereSelected.chapitres.find(c => c.id === chapitreId);
  
  $('home-screen').classList.add('hidden');
  $('pre-quiz-screen').classList.remove('hidden');
  $('pre-quiz-title').textContent = currentChapitreSelected.titre;
  $('pre-quiz-theme').textContent = currentChapitreSelected.theme || "Général";

  // Tri de l'affichage selon le type de chapitre (Natat ou Créé par IA locale)
  if (currentChapitreSelected.isCustomIA) {
    $('wrapper-cours-standard').classList.add('hidden');
    $('wrapper-cours-ia').classList.remove('hidden');
    $('btn-open-exercice').classList.add('hidden');

    $('btn-ia-cours').onclick = () => lancerQuizCustomIA('cours');
    $('btn-ia-exercices').onclick = () => lancerQuizCustomIA('exercice');
  } else {
    $('wrapper-cours-ia').classList.add('hidden');
    $('wrapper-cours-standard').classList.remove('hidden');
    $('pre-quiz-cours-text').textContent = currentChapitreSelected.cours || "";
    $('pre-quiz-piege-text').textContent = currentChapitreSelected.piege || "";

    $('btn-lvl-1').onclick = () => lancerQuiz(1);
    $('btn-lvl-2').onclick = () => lancerQuiz(2);
    $('btn-lvl-3').onclick = () => lancerQuiz(3);
    
    if (currentChapitreSelected.exercice_ouvert) {
      $('btn-open-exercice').classList.remove('hidden');
      $('btn-open-exercice').onclick = () => ouvrirExerciceOuvert();
    } else {
      $('btn-open-exercice').classList.add('hidden');
    }
  }
}

function goHome() {
  $('pre-quiz-screen').classList.add('hidden');
  $('quiz-screen').classList.add('hidden');
  if($('open-exercise-screen')) $('open-exercise-screen').classList.add('hidden');
  $('flashcards-screen').classList.add('hidden');
  $('home-screen').classList.remove('hidden');
  clearInterval(timerInterval);
}

// Lancement d'un quiz natif
function lancerQuiz(niveau) {
  AppState.quiz.chapitreId = currentChapitreSelected.id;
  AppState.quiz.idx = 0;
  AppState.quiz.score = 0;
  AppState.quiz.isAutomatisme = false;
  AppState.quiz.isCustomIA = false;
  
  if (currentMatiereSelected.id.includes('maths')) {
    AppState.quiz.questions = Array.from({length: 4}, () => genererMutationMathsAleatoire(currentChapitreSelected.theme));
  } else {
    let pool = currentChapitreSelected.questions ? currentChapitreSelected.questions.filter(q => q.niveau === niveau) : [];
    AppState.quiz.questions = obtenirQuestionsFiltrees(pool, 3);
  }
  
  if(AppState.quiz.questions.length === 0) {
    alert("Aucune question de ce niveau n'est enregistrée.");
    return;
  }
  $('pre-quiz-screen').classList.add('hidden');
  $('quiz-screen').classList.remove('hidden');
  afficherQuestion();
}

// 🤖 SIMULATION DE L'IA PROCEDURALE LOCALE (BOUTON 1 ET 2) - GÉNÉRATION INFINIE
function lancerQuizCustomIA(mode) {
  AppState.quiz.chapitreId = currentChapitreSelected.id;
  AppState.quiz.isAutomatisme = false;
  AppState.quiz.isCustomIA = true;
  AppState.quiz.idx = 0;
  AppState.quiz.score = 0;

  if (mode === 'cours') {
    // Bouton 1 : Résumé + Fondamentaux à la volée
    const sourceData = currentChapitreSelected.rawSource || "générique";
    AppState.quiz.questions = [
      {
        enonce: `[Fondamental] Concernant le sujet "${currentChapitreSelected.titre}", quelle est la règle ou définition centrale à retenir ?`,
        options: [
          `Celle extraite de tes notes : "${sourceData.slice(0, 45)}..."`,
          "Une formulation alternative erronée",
          "Un contre-sens sur le cours"
        ],
        bonne_reponse: 0,
        explication: `Le résumé basé sur ton import spécifie : ${sourceData}`
      },
      genererMutationMathsAleatoire(currentChapitreSelected.titre)
    ];
    $('pre-quiz-screen').classList.add('hidden');
    $('quiz-screen').classList.remove('hidden');
    afficherQuestion();
  } else {
    // Bouton 2 : Exercice de révision rédigé à génération unique
    $('pre-quiz-screen').classList.add('hidden');
    $('open-exercise-screen').classList.remove('hidden');
    $('open-ex-title').textContent = currentChapitreSelected.titre;
    
    // Génération mathématique unique pour casser les automatismes
    const valX = Math.floor(Math.random() * 10) + 2;
    $('open-ex-enonce').textContent = `[Sujet Unique Modifié] En utilisant les données de ton chapitre "${currentChapitreSelected.titre}", modélise le problème pour la valeur clé de test K = ${valX}. Développe le raisonnement et valide chaque étape.`;
    
    $('open-ex-textarea').value = "";
    $('open-ex-correction-box').classList.add('hidden');
    $('btn-validate-open-ex').classList.remove('hidden');
    
    $('btn-validate-open-ex').onclick = () => {
      $('btn-validate-open-ex').classList.add('hidden');
      $('open-ex-correction-box').classList.remove('hidden');
      const containerCriteres = $('open-ex-critere-list');
      containerCriteres.innerHTML = `
        <label style="display:flex; align-items:start; gap:10px; font-size:.85rem; background:white; padding:12px; border-radius:10px; border:1px solid var(--border-color);"><input type="checkbox" class="critere-cb"> <span>J'ai correctement isolé la variable avec la valeur ${valX}</span></label>
        <label style="display:flex; align-items:start; gap:10px; font-size:.85rem; background:white; padding:12px; border-radius:10px; border:1px solid var(--border-color);"><input type="checkbox" class="critere-cb"> <span>Mon résultat respecte la structure de mes fiches ou photos importées</span></label>
      `;
    };
    
    $('btn-finish-open-ex').onclick = () => {
      alert("Résultats de l'évaluation enregistrés.");
      goHome();
    };
  }
}

function afficherQuestion() {
  $('quiz-explanation-box').className = "explanation-box hidden";
  $('quiz-next').disabled = true;
  
  const currentQ = AppState.quiz.questions[AppState.quiz.idx];
  const totalQs = AppState.quiz.questions.length;
  
  $('quiz-progress-text').textContent = `Question ${AppState.quiz.idx + 1} / ${totalQs}`;
  $('quiz-progress-bar').style.width = `${((AppState.quiz.idx + 1) / totalQs) * 100}%`;
  $('quiz-question-text').textContent = currentQ.enonce;
  
  const optionsContainer = $('quiz-options-container');
  optionsContainer.innerHTML = "";
  
  currentQ.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => soumettreReponse(index, btn);
    optionsContainer.appendChild(btn);
  });
}

function soumettreReponse(indexChoisi, boutonClique) {
  const currentQ = AppState.quiz.questions[AppState.quiz.idx];
  const boutons = document.querySelectorAll('.option-btn');
  boutons.forEach(b => b.disabled = true);
  
  const estCorrect = (indexChoisi === currentQ.bonne_reponse);
  if (estCorrect) {
    AppState.quiz.score++;
    boutonClique.style.background = "#DCFCE7";
    boutonClique.style.borderColor = "var(--color-success)";
    boutonClique.style.color = "#15803D";
    $('quiz-explanation-box').className = "explanation-box visible good";
    $('explanation-status').textContent = "✅ VALIDÉ";
  } else {
    boutonClique.style.background = "#FEE2E2";
    boutonClique.style.borderColor = "var(--color-danger)";
    boutonClique.style.color = "#B91C1C";
    boutons[currentQ.bonne_reponse].style.background = "#DCFCE7";
    boutons[currentQ.bonne_reponse].style.borderColor = "var(--color-success)";
    boutons[currentQ.bonne_reponse].style.color = "#15803D";
    $('quiz-explanation-box').className = "explanation-box visible bad";
    $('explanation-status').textContent = "❌ À REVOIR";
  }
  
  $('explanation-text').textContent = currentQ.explication || "";
  $('quiz-next').disabled = false;
  
  enregistrerLacune(currentChapitreSelected ? currentChapitreSelected.theme : "Général", estCorrect);
}

$('quiz-next').onclick = () => {
  AppState.quiz.idx++;
  if (AppState.quiz.idx < AppState.quiz.questions.length) {
    afficherQuestion();
  } else {
    alert(`Session terminée. Score final : ${AppState.quiz.score} / ${AppState.quiz.questions.length}`);
    goHome();
  }
};

// 🧭 MODAL GESTION HUB D'INGESTION MULTIMODAL
function openAddChapterModal(matiereId) {
  AppState.targetMatiereIdForAdd = matiereId;
  AppState.extractedOcrText = "";
  $('input-new-chap-title').value = "";
  $('area-ingest-text').value = "";
  $('input-ingest-url').value = "";
  $('modal-add-chapter').classList.remove('hidden');
  switchIngestTab('tab-text');
}

function closeAddChapterModal() {
  $('modal-add-chapter').classList.add('hidden');
}

function switchIngestTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $(tabId).classList.add('active');
  
  // Met en surbrillance le bon bouton d'onglet
  const btns = document.querySelectorAll('.tab-btn');
  if(tabId === 'tab-text') btns[0].classList.add('active');
  if(tabId === 'tab-photo') btns[1].classList.add('active');
  if(tabId === 'tab-link') btns[2].classList.add('active');
}

function configurerOcrEvents() {
  $('file-camera-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    $('ocr-status-container').classList.remove('hidden');
    $('ocr-progress-label').textContent = "Lecture du document en cours (OCR local)...";
    
    try {
      // Exécution de l'OCR directement sur le processeur du smartphone
      const worker = await Tesseract.createWorker('fra');
      const ret = await worker.recognize(file);
      AppState.extractedOcrText = ret.data.text;
      await worker.terminate();
      
      $('ocr-status-container').classList.add('hidden');
      alert("✅ Document numérisé avec succès ! L'IA locale est prête.");
    } catch (err) {
      $('ocr-status-container').classList.add('hidden');
      alert("Erreur lors de l'OCR local. Copie ton texte manuellement.");
    }
  };

  $('btn-submit-new-chap').onclick = () => {
    const titre = $('input-new-chap-title').value.trim();
    if (!titre) { alert("Donne un nom à ton chapitre."); return; }

    let sourceFinale = "";
    const activeTab = document.querySelector('.tab-content.active').id;

    if (activeTab === 'tab-text') sourceFinale = $('area-ingest-text').value.trim();
    else if (activeTab === 'tab-photo') sourceFinale = AppState.extractedOcrText;
    else if (activeTab === 'tab-link') sourceFinale = "Contenu extrait du lien externe : " + $('input-ingest-url').value.trim();

    const mat = AppState.data.matieres.find(m => m.id === AppState.targetMatiereIdForAdd);
    if(mat) {
      mat.chapitres.push({
        id: "custom_" + Date.now(),
        titre: titre,
        theme: "Perso",
        isCustomIA: true,
        rawSource: sourceFinale || "Aucune note additionnelle fournie."
      });
      localStorage.setItem('dnb_custom_curriculum', JSON.stringify(AppState.data));
      construireMenuMatieres();
      closeAddChapterModal();
    }
  };
}

// 🎴 ENGINE FLASHCARDS COMPLET
let flashcardsPool = [];
let currentFlashcardIdx = 0;

function configurerFlashcardsMenu() {
  $('nav-home').onclick = () => {
    $('nav-home').classList.add('active');
    $('nav-flashcards').classList.remove('active');
    goHome();
  };

  $('nav-flashcards').onclick = () => {
    $('nav-flashcards').classList.add('active');
    $('nav-home').classList.remove('active');
    
    genererFlashcardsPool();
    if (flashcardsPool.length === 0) { alert("Aucune donnée disponible pour créer les fiches."); return; }
    
    currentFlashcardIdx = 0;
    $('home-screen').classList.add('hidden');
    $('pre-quiz-screen').classList.add('hidden');
    $('quiz-screen').classList.add('hidden');
    $('flashcards-screen').classList.remove('hidden');
    afficherFlashcard();
  };

  $('flashcard-card-box').onclick = () => $('flashcard-card-box').classList.toggle('flipped');

  $('flashcard-next').onclick = (e) => {
    e.stopPropagation();
    currentFlashcardIdx++;
    if (currentFlashcardIdx >= flashcardsPool.length) {
      alert("Félicitations, tu as parcouru toutes les fiches de révision !");
      $('nav-home').click();
    } else {
      afficherFlashcard();
    }
  };
}

function genererFlashcardsPool() {
  flashcardsPool = [];
  AppState.data.matieres.forEach(m => {
    if (!m.chapitres) return;
    m.chapitres.forEach(c => {
      if (c.isCustomIA) {
        flashcardsPool.push({
          matiere: m.label, chapitre: c.titre,
          recto: `Rappeler l'essentiel du cours personnalisé : "${c.titre}"`,
          verso: c.rawSource
        });
      } else {
        if (c.cours) {
          flashcardsPool.push({
            matiere: m.label, chapitre: c.titre,
            recto: `Définition / Propriété clé de : \n"${c.titre}"`, verso: c.cours
          });
        }
      }
    });
  });
}

function afficherFlashcard() {
  const card = flashcardsPool[currentFlashcardIdx];
  $('flashcard-card-box').classList.remove('flipped');
  $('flashcard-meta').textContent = `${card.matiere} • ${card.chapitre}`;
  $('flashcard-front-text').textContent = card.recto;
  $('flashcard-back-text').textContent = card.verso;
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

document.addEventListener('DOMContentLoaded', initialiserApp);
