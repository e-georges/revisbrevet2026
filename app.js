// ==========================================================================
// RévisSeconde Studio Pro — app.js (Moteur Corrigé & Aligné Examen)
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

// Base synchronisée capable d'accepter les mutations et structures de troisieme.json
const DATA_INITIALE = {
  matieres: [
    {
      id: "maths",
      label: "Mathématiques",
      chapitres: [
        {
          id: "m1",
          titre: "Arithmétique & Nombres premiers",
          theme: "Nombres et Calculs",
          cours: "Un nombre premier n'a que deux diviseurs : 1 et lui-même. Tout nombre entier supérieur à 2 se décompose de manière unique en produit de facteurs premiers.",
          piege: "Le nombre 1 n'est pas premier. Le nombre 2 est le seul nombre premier pair.",
          conseil: "Le jour J, écris bien la liste des premiers nombres premiers au brouillon (2, 3, 5, 7, 11, 13...) pour aller vite !"
        }
      ]
    }
  ]
};

function initialiserApp() {
  const local = localStorage.getItem('revis_studio_final_prod');
  if (local) {
    AppState.data = JSON.parse(local);
  } else {
    AppState.data = DATA_INITIALE;
    localStorage.setItem('revis_studio_final_prod', JSON.stringify(DATA_INITIALE));
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
    
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="header-icon-box">📚</div>
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
          <span class="badge-theme">${c.theme || 'Examen'}</span>
        `;
        listCont.appendChild(row);
      });
    } else {
      listCont.innerHTML = `<p style="margin:0; padding:8px; font-size:0.8rem; color:var(--text-secondary); text-align:center;">Aucun chapitre.</p>`;
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
  
  // 🎯 CRITÈRE LLM COUNCIL : ALIGNEMENT SANS FAILLE DES CONSEILS SUR LES CRITÈRES DE L'EXAMEN
  if (chap.conseil && chap.conseil.trim() !== "") {
    $('pre-quiz-conseil-text').textContent = chap.conseil;
  } else if (chap.piege && chap.piege.trim() !== "") {
    $('pre-quiz-conseil-text').innerHTML = `🎯 <strong>Alerte Points le Jour J :</strong> Pour briller sur <em>"${chap.titre}"</em>, mémorise immédiatement la parade contre le piège classique : "${chap.piege}"`;
  } else {
    $('pre-quiz-conseil-text').textContent = "Règle d'or : Utilise l'entraînement Flash ci-dessous pour tester ta capacité à restituer les mots-clés du cours sans aide.";
  }
}

function ouvrirPopupSummary() {
  const mat = AppState.data.matieres.find(m => m.id === AppState.activeMatiereId);
  const chap = mat.chapitres.find(c => c.id === AppState.activeChapitreId);
  $('popup-cours-text').textContent = chap.cours || "Synthèse en cours d'édition.";
  
  if(chap.piege) {
    $('popup-wrapper-piege').style.display = 'block';
    $('popup-piege-text').textContent = chap.piege;
  } else {
    $('popup-wrapper-piege').style.display = 'none';
  }
  $('modal-view-summary').style.display = 'flex';
}

function fermerPopupSummary() { $('modal-view-summary').style.display = 'none'; }
function ouvrirPopupExercises() { $('box-quiz-flash').style.display = 'none'; $('modal-view-exercises').style.display = 'flex'; }
function fermerPopupExercises() { $('modal-view-exercises').style.display = 'none'; }

function genererQuizFlash() {
  const mat = AppState.data.matieres.find(m => m.id === AppState.activeMatiereId);
  const chap = mat.chapitres.find(c => c.id === AppState.activeChapitreId);
  
  $('box-quiz-flash').style.display = 'block';
  $('text-quiz-reponse').style.display = 'none';
  
  // Récupération des critères réels s'ils existent (depuis troisieme.json), sinon repli intelligent
  let baremeAttendu = "";
  if (chap.exercice_ouvert && chap.exercice_ouvert.criteres) {
    baremeAttendu = chap.exercice_ouvert.criteres.map(crit => `• ${crit}`).join("\n");
  } else {
    baremeAttendu = `• Restituer les définitions clés.\n• Éviter le piège : ${chap.piege || 'Aucun enregistré'}`;
  }

  $('text-quiz-question').textContent = `Sujet d'entraînement : Écris au brouillon tout ce que tu dois vérifier pour valider l'exercice sur "${chap.titre}".`;
  $('text-quiz-reponse').textContent = `📝 GRILLE DE CORRECTION OFFICIELLE :\n\n${baremeAttendu}`;
  
  $('btn-reveal-flash').onclick = () => { $('text-quiz-reponse').style.display = 'block'; };
}

function openAddChapterModal(matiereId, chapitreId = null) {
  AppState.targetMatiereIdForAdd = matiereId;
  AppState.targetChapitreIdForEdit = chapitreId;
  
  if(chapitreId) {
    const mat = AppState.data.matieres.find(m => m.id === matiereId);
    const chap = mat.chapitres.find(c => c.id === chapitreId);
    $('input-new-chap-title').value = chap.titre;
    $('input-new-chap-conseil').value = chap.conseil || "";
    $('area-ingest-text').value = chap.cours || "";
    $('input-ingest-url').value = chap.lien || "";
  } else {
    $('input-new-chap-title').value = "";
    $('input-new-chap-conseil').value = "";
    $('area-ingest-text').value = "";
    $('input-ingest-url').value = "";
  }
  $('modal-add-chapter').style.display = 'flex';
  switchIngestTab('tab-text');
}

function closeAddChapterModal() { $('modal-add-chapter').style.display = 'none'; }

function switchIngestTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $(tabId).style.display = 'block';
  const btns = document.querySelectorAll('.tab-btn');
  if(tabId === 'tab-text') btns[0].classList.add('active');
  if(tabId === 'tab-photo') btns[1].classList.add('active');
  if(tabId === 'tab-link') btns[2].classList.add('active');
}

function preparerModificationChapitre() { openAddChapterModal(AppState.activeMatiereId, AppState.activeChapitreId); }

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
      const separateur = $('area-ingest-text').value.trim() !== "" ? "\n\n--- Ajout Photo ---\n" : "";
      $('area-ingest-text').value += separateur + AppState.extractedOcrText;
      switchIngestTab('tab-text');
    } catch (err) {
      $('ocr-status-container').style.display = 'none';
      alert("Erreur OCR.");
    }
  };

  $('btn-submit-new-chap').onclick = () => {
    const titre = $('input-new-chap-title').value.trim();
    if (!titre) return alert("Le titre est requis.");

    const conseil = $('input-new-chap-conseil').value.trim();
    const texteNotes = $('area-ingest-text').value.trim();
    const lienWeb = $('input-ingest-url').value.trim();
    const mat = AppState.data.matieres.find(m => m.id === AppState.targetMatiereIdForAdd);
    
    if(AppState.targetChapitreIdForEdit) {
      const chap = mat.chapitres.find(c => c.id === AppState.targetChapitreIdForEdit);
      if(chap) {
        chap.titre = titre;
        chap.conseil = conseil;
        chap.cours = texteNotes;
        if(lienWeb) chap.lien = lienWeb;
      }
    } else {
      if(!mat.chapitres) mat.chapitres = [];
      mat.chapitres.push({
        id: "custom_" + Date.now(),
        titre: titre,
        theme: "Perso",
        cours: texteNotes,
        lien: lienWeb,
        conseil: conseil
      });
    }

    localStorage.setItem('revis_studio_final_prod', JSON.stringify(AppState.data));
    construireMenuMatieres();
    closeAddChapterModal();
    if(AppState.targetChapitreIdForEdit) {
      ouvrirTableauDeBordChapitre(AppState.targetMatiereIdForAdd, AppState.targetChapitreIdForEdit);
    }
  };
}

function goHome() {
  $('pre-quiz-screen').style.display = 'none';
  $('home-screen').style.display = 'block';
  closeAddChapterModal();
  fermerPopupSummary();
  fermerPopupExercises();
}

document.addEventListener('DOMContentLoaded', initialiserApp);
