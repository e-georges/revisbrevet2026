// ==========================================================================
// RévisSeconde Studio Pro — app.js (Moteur Synchrone Complet)
// ==========================================================================

const AppState = {
  data: null,
  targetMatiereIdForAdd: null,
  targetChapitreIdForEdit: null, 
  activeMatiereId: null,
  activeChapitreId: null,
  extractedOcrText: ""
};

const $ = id => document.getElementById(id);

// Données types conformes à la classe de Seconde Générale
const DATA_INITIALE = {
  matieres: [
    {
      id: "maths_2de",
      label: "Mathématiques",
      chapitres: [
        {
          id: "intervalles",
          titre: "Ensembles de nombres & Intervalles",
          theme: "Algèbre",
          cours: "En Seconde, on étudie les structures de nombres : ℕ, ℤ, 𝔻, ℚ et ℝ.\nUn intervalle [a ; b] rassemble l'ensemble des nombres réels x vérifiant la condition a ≤ x ≤ b.",
          piege: "Vérifie toujours si le crochet est ouvert (valeur exclue) ou fermé (valeur incluse) !"
        }
      ]
    },
    {
      id: "francais_2de",
      label: "Français",
      chapitres: [
        {
          id: "commentaire",
          titre: "Le Commentaire de Texte",
          theme: "Méthode",
          cours: "Le commentaire de texte demande de lier constamment le sens d'un extrait littéraire avec ses procédés stylistiques (métaphores, syntaxe, rythmes).",
          piege: "Le piège éliminatoire consiste à paraphraser le texte sans proposer d'analyse critique."
        }
      ]
    },
    {
      id: "physique_2de",
      label: "Physique-Chimie",
      chapitres: [
        {
          id: "mole",
          titre: "La quantité de matière (La Mole)",
          theme: "Chimie",
          cours: "La mole (mol) sert à dénombrer les entités chimiques microscopiques. Un échantillon de 1 mole comporte exactement 6,02 x 10^23 entités (Constante d'Avogadro NA).",
          piege: "Ne mélange jamais la masse totale m (exprimée en grammes) et le nombre de moles n (en mol)."
        }
      ]
    }
  ]
};

// Mappage vectoriel propre des icônes de matières
const SVGMappings = {
  "maths_2de": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  "francais_2de": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  "physique_2de": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M3 12h18"/></svg>`
};

function initialiserApp() {
  const local = localStorage.getItem('revis_seconde_studio_v3');
  if (local) {
    AppState.data = JSON.parse(local);
  } else {
    AppState.data = DATA_INITIALE;
    localStorage.setItem('revis_seconde_studio_v3', JSON.stringify(DATA_INITIALE));
  }
  construireMenuMatieres();
  configurerOcrEvents();
  $('nav-home').onclick = () => goHome();
}

function construireMenuMatieres() {
  const container = $('matieres-container');
  if (!container) return;
  container.innerHTML = "";
  
  AppState.data.matieres.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const header = document.createElement('div');
    header.className = 'matiere-trigger-header';
    const icon = SVGMappings[m.id] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
    
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="header-icon-box">${icon}</div>
        <h3 style="margin:0; font-size:1rem; font-weight:700; color:var(--text-primary);">${m.label}</h3>
      </div>
      <svg class="arrow-indicator" viewBox="0 0 24 24" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    `;
    
    const bodyContent = document.createElement('div');
    bodyContent.className = 'matiere-chapters-body';
    
    const listCont = document.createElement('div');
    listCont.className = "chapters-list-zone";
    bodyContent.appendChild(listCont);

    if (m.chapitres && m.chapitres.length > 0) {
      m.chapitres.forEach(c => {
        const row = document.createElement('div');
        row.className = "chapitre-row-item";
        row.onclick = (e) => ouvrirTableauDeBordChapitre(m.id, c.id, e);
        row.innerHTML = `
          <span>${c.titre}</span>
          <span class="badge-theme">${c.theme || 'Perso'}</span>
        `;
        listCont.appendChild(row);
      });
    } else {
      listCont.innerHTML = `<p style="margin:0; padding:8px; font-size:0.8rem; color:var(--text-secondary); text-align:center;">Aucun chapitre. Ajoutez-en un ci-dessous !</p>`;
    }

    const btnAdd = document.createElement('button');
    btnAdd.className = "btn-add-chapter-trigger";
    btnAdd.textContent = "＋ Ajouter un chapitre dans cette matière";
    btnAdd.onclick = (e) => {
      e.stopPropagation();
      openAddChapterModal(m.id);
    };
    bodyContent.appendChild(btnAdd);

    header.onclick = () => {
      const isOpen = bodyContent.classList.contains('is-open');
      document.querySelectorAll('.matiere-chapters-body').forEach(b => b.classList.remove('is-open'));
      document.querySelectorAll('.arrow-indicator').forEach(a => a.classList.remove('rotated'));
      if (!isOpen) {
        bodyContent.classList.add('is-open');
        header.querySelector('.arrow-indicator').classList.add('rotated');
      }
    };

    card.appendChild(header);
    card.appendChild(bodyContent);
    container.appendChild(card);
  });
}

function openAddChapterModal(matiereId, chapitreId = null) {
  AppState.targetMatiereIdForAdd = matiereId;
  AppState.targetChapitreIdForEdit = chapitreId;
  
  if(chapitreId) {
    // Mode Modification : Chargement des inputs
    const mat = AppState.data.matieres.find(m => m.id === matiereId);
    const chap = mat.chapitres.find(c => c.id === chapitreId);
    $('input-new-chap-title').value = chap.titre;
    $('area-ingest-text').value = chap.cours || "";
    $('input-ingest-url').value = chap.lien || "";
  } else {
    // Mode Nouvel Ajout : Remise à zéro
    $('input-new-chap-title').value = "";
    $('area-ingest-text').value = "";
    $('input-ingest-url').value = "";
  }

  $('modal-add-chapter').style.display = 'flex';
  switchIngestTab('tab-text');
}

function closeAddChapterModal() {
  $('modal-add-chapter').style.display = 'none';
}

function switchIngestTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $(tabId).style.display = 'block';
  
  const btns = document.querySelectorAll('.tab-btn');
  if(tabId === 'tab-text') btns[0].classList.add('active');
  if(tabId === 'tab-photo') btns[1].classList.add('active');
  if(tabId === 'tab-link') btns[2].classList.add('active');
}

function ouvrirTableauDeBordChapitre(matiereId, chapitreId, event) {
  if (event) event.stopPropagation();
  AppState.activeMatiereId = matiereId;
  AppState.activeChapitreId = chapitreId;

  const mat = AppState.data.matieres.find(m => m.id === matiereId);
  const chap = mat.chapitres.find(c => c.id === chapitreId);
  
  $('home-screen').style.display = 'none';
  $('pre-quiz-screen').style.display = 'block';
  
  $('chapter-matiere-badge').textContent = mat.label;
  $('pre-quiz-title').textContent = chap.titre;
  $('pre-quiz-cours-text').textContent = chap.cours || "Contenu vide. Cliquez sur Modifier pour l'enrichir.";
  
  if(chap.piege) {
    $('wrapper-piege').style.display = 'block';
    $('pre-quiz-piege-text').textContent = chap.piege;
  } else {
    $('wrapper-piege').style.display = 'none';
  }

  $('box-quiz-flash').style.display = 'none';
  switchChapterSubView('view-summary');
}

function switchChapterSubView(view) {
  document.querySelectorAll('.chapter-sub-view').forEach(v => v.style.display = 'none');
  document.querySelectorAll('#pre-quiz-screen .btn-primary, #pre-quiz-screen .btn-success').forEach(b => b.style.opacity = '0.6');
  
  if(view === 'view-summary') {
    $('sub-view-summary').style.display = 'block';
    $('btn-sub-summary').style.opacity = '1';
  }
  if(view === 'view-exercises') {
    $('sub-view-exercises').style.display = 'block';
    $('btn-sub-exercises').style.opacity = '1';
  }
}

function preparerModificationChapitre() {
  openAddChapterModal(AppState.activeMatiereId, AppState.activeChapitreId);
}

function genererQuizFlash() {
  const mat = AppState.data.matieres.find(m => m.id === AppState.activeMatiereId);
  const chap = mat.chapitres.find(c => c.id === AppState.activeChapitreId);
  
  $('box-quiz-flash').style.display = 'block';
  $('text-quiz-reponse').style.display = 'none';
  
  $('text-quiz-question').textContent = `Explique avec tes propres mots ce que contient la fiche : "${chap.titre}". Quelles sont les notions fondamentales ?`;
  $('text-quiz-reponse').textContent = `📚 ÉLÉMENTS DE RÉPONSES ATTENDUS :\n\n${chap.cours || 'Aucune note'}`;
  
  $('btn-reveal-flash').onclick = () => {
    $('text-quiz-reponse').style.display = 'block';
  };
}

function configurerOcrEvents() {
  $('file-camera-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    $('ocr-status-container').style.display = 'flex';
    
    try {
      const worker = await Tesseract.createWorker('fra');
      const ret = await worker.recognize(file);
      AppState.extractedOcrText = ret.data.text;
      await worker.terminate();
      $('ocr-status-container').style.display = 'none';
      
      // On injecte le texte lu à la suite du texte existant
      const separateur = $('area-ingest-text').value.trim() !== "" ? "\n\n--- Nouvel ajout photo ---\n" : "";
      $('area-ingest-text').value += separateur + AppState.extractedOcrText;
      
      switchIngestTab('tab-text');
      alert("✅ Texte extrait ajouté avec succès dans l'onglet Saisie ! Vérifie ou complète-le avant d'enregistrer.");
    } catch (err) {
      $('ocr-status-container').style.display = 'none';
      alert("Échec de la lecture optique. Merci d'écrire manuellement.");
    }
  };

  $('btn-submit-new-chap').onclick = () => {
    const titre = $('input-new-chap-title').value.trim();
    if (!titre) return alert("Veuillez donner un titre à ce chapitre.");

    const texteNotes = $('area-ingest-text').value.trim();
    const lienWeb = $('input-ingest-url').value.trim();

    const mat = AppState.data.matieres.find(m => m.id === AppState.targetMatiereIdForAdd);
    
    if(AppState.targetChapitreIdForEdit) {
      // ÉDITION / ENRICHISSEMENT
      const chap = mat.chapitres.find(c => c.id === AppState.targetChapitreIdForEdit);
      if(chap) {
        chap.titre = titre;
        chap.cours = texteNotes;
        if(lienWeb) chap.lien = lienWeb;
      }
    } else {
      // CRÉATION INITIALE
      if(!mat.chapitres) mat.chapitres = [];
      mat.chapitres.push({
        id: "custom_" + Date.now(),
        titre: titre,
        theme: "Perso",
        cours: texteNotes,
        lien: lienWeb
      });
    }

    localStorage.setItem('revis_seconde_studio_v3', JSON.stringify(AppState.data));
    construireMenuMatieres();
    closeAddChapterModal();
    
    // Rafraîchissement direct de la vue du chapitre si on était dedans
    if(AppState.targetChapitreIdForEdit) {
      ouvrirTableauDeBordChapitre(AppState.targetMatiereIdForAdd, AppState.targetChapitreIdForEdit);
    }
  };
}

function goHome() {
  $('pre-quiz-screen').style.display = 'none';
  $('home-screen').style.display = 'block';
  closeAddChapterModal();
}

document.addEventListener('DOMContentLoaded', initialiserApp);
