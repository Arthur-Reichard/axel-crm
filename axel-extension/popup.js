document.getElementById("scrape").addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    if (!tab) {
      console.log("Aucun onglet actif trouvé !");
      return;
    }
  
    console.log("Exécution du script dans l'onglet :", tab.id);
  
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeLinkedInProfile
    });
  });
  
  function scrapeLinkedInProfile() {
    console.log("Début du scraping sur le profil LinkedIn");
  
    const profileUrl = window.location.href;
  
    // Fonction utilitaire pour obtenir le texte d'un élément
    const getText = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.innerText.trim() : "";
    };
  
    // **1. Extraction du prénom et nom depuis l'URL**
    let prenom = "";
    let nom = "";
    const urlSegments = profileUrl.split("/")[4].split("-");
    if (urlSegments.length >= 2) {
      prenom = capitalize(urlSegments[0]); // Premier segment comme prénom
      nom = capitalize(urlSegments.slice(1, -1).join(" ")); // Le reste comme nom, sans l'ID
    }
  
    // **2. Extraction de la localisation (ville et pays)**
    let ville = "";
    let pays = "";
  
    const localisationEl = document.querySelector(".text-body-small.inline.t-black--light.break-words");
    if (localisationEl) {
      const localisation = localisationEl.innerText.trim().split(", ");
      ville = localisation[0] || "";
      pays = localisation[localisation.length - 1] || "";
    }
  
    // **3. Extraction du poste et de l'entreprise (secteur professionnel)**
    let poste = "";
    let entreprise = "";
  
    const experienceSection = document.querySelector(".pvs-entity.pvs-entity--with-arrow");
  
    if (experienceSection) {
      poste = getText(".t-14.t-normal"); // Poste actuel
      entreprise = getText(".pv-entity__secondary-title"); // Entreprise associée
    }
  
    // Si on ne trouve pas le poste ou l'entreprise dans cette section, on cherche ailleurs
    if (!poste || !entreprise) {
      const fallbackExperience = document.querySelector(".pv-entity__summary-info");
      if (fallbackExperience) {
        poste = getText(".t-16");
        entreprise = getText(".pv-entity__secondary-title");
      }
    }
  
    // **4. Ouverture du tableau "Coordonnées" et récupération de l'email et téléphone**
    let email = "";
    let phone = "";
  
    // Ouvrir la section coordonnées si elle est cachée
    const contactInfoButton = document.querySelector("a[href*='contact-info']");
    if (contactInfoButton) {
      contactInfoButton.click(); // Simule un clic pour ouvrir la section Coordonnées
      setTimeout(() => {
        // Recherche l'email dans la section coordonnées
        const emailEl = document.querySelector("a[href^='mailto:']");
        if (emailEl) {
          email = emailEl.href.replace("mailto:", "").trim();
        }
  
        // Recherche du téléphone dans la section coordonnées
        const phoneEl = document.querySelector("a[href^='tel:']");
        if (phoneEl) {
          phone = phoneEl.href.replace("tel:", "").trim();
        }
  
        // **5. Affichage des informations récupérées**
        const lead = {
          prenom,
          nom,
          poste,
          entreprise,
          ville,
          pays,
          email,
          phone,
          profileUrl
        };
  
        console.log("Informations récupérées :", lead);
        alert(JSON.stringify(lead, null, 2)); // Affiche les données scrappées
  
      }, 1000); // Attente d'une seconde pour garantir que la section "Coordonnées" soit complètement affichée
    } else {
      // Si la section "Coordonnées" est déjà ouverte ou absente, récupère les infos de l'email et du téléphone
      const emailEl = document.querySelector("a[href^='mailto:']");
      if (emailEl) {
        email = emailEl.href.replace("mailto:", "").trim();
      }
  
      const phoneEl = document.querySelector("a[href^='tel:']");
      if (phoneEl) {
        phone = phoneEl.href.replace("tel:", "").trim();
      }
  
      // Affichage des informations récupérées sans avoir ouvert la section "Coordonnées"
      const lead = {
        prenom,
        nom,
        poste,
        entreprise,
        ville,
        pays,
        email,
        phone,
        profileUrl
      };
  
      console.log("Informations récupérées :", lead);
      alert(JSON.stringify(lead, null, 2)); // Affiche les données scrappées
    }
  }
  
  // Fonction pour mettre en majuscule la première lettre d'un mot
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  