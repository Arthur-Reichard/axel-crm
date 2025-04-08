// ✅ popup.js (RESTARTED + MINIMAL FUNCTIONAL VERSION)

import { supabase } from './supabaseClient.js';

let currentUser = null;
let lead = {};

const authSection = document.getElementById("auth-section");
const loginBtn = document.getElementById("login");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const scrapeBtn = document.getElementById("scrape");
const sendBtn = document.getElementById("send");
const result = document.getElementById("result");

scrapeBtn.style.display = "none";
sendBtn.style.display = "none";

// 🔐 Connexion utilisateur
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert("Erreur de connexion : " + error.message);

  const { data: userInfo, error: userError } = await supabase
    .from("utilisateurs")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (userError || !userInfo) {
    await supabase.auth.signOut();
    return alert("Utilisateur non autorisé.");
  }

  currentUser = data.user;
  authSection.style.display = "none";
  scrapeBtn.style.display = "block";
});

// ▶️ Scraper bouton
scrapeBtn.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: scrapeLinkedInProfile,
  });
});

// ➕ Ajouter au CRM
sendBtn.addEventListener("click", async () => {
  if (!currentUser) return alert("Non connecté.");
  const { error } = await supabase.from("leads").insert([lead]);
  if (error) alert("Erreur Supabase : " + error.message);
  else alert("✅ Lead ajouté !");
});

function scrapeLinkedInProfile() {
  const getText = (sel) => document.querySelector(sel)?.innerText.trim() || "";
  const url = window.location.href;
  const urlParts = url.split("/")[4]?.split("-") || [];

  const data = {
    prenom: capitalize(urlParts[0] || ""),
    nom: capitalize((urlParts.slice(1, -1) || []).join(" ")),
    entreprise: getText(".pv-entity__secondary-title"),
    poste: getText(".t-14.t-normal"),
    ville: "",
    pays: "",
    email: document.querySelector("a[href^='mailto']")?.href.replace("mailto:", "") || "",
    phone: document.querySelector("a[href^='tel']")?.href.replace("tel:", "") || "",
    profile_url: url,
  };

  const loc = getText(".text-body-small.inline.t-black--light.break-words").split(", ");
  data.ville = loc[0] || "";
  data.pays = loc[loc.length - 1] || "";

  chrome.storage.local.set({ scrapedLead: data });
  alert(JSON.stringify(data, null, 2));
}

chrome.storage.local.get("scrapedLead", (res) => {
  if (res.scrapedLead) {
    lead = res.scrapedLead;
    result.innerText = JSON.stringify(lead, null, 2);
    sendBtn.style.display = "block";
  }
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}