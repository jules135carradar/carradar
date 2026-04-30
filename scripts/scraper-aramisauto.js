const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 100;

function parseH3(h3) {
  // Exemples réels:
  // "Peugeot 208 50 kWh 136ch • GT + GPS Électrique • Auto. • 340km WLTP _2021_"
  // "Peugeot 2008 100 S&S BVM6 • Allure Essence • Manuelle _2025_ • 16 303 km"
  // "Peugeot 3008 Hybrid 225 e-EAT8 • Allure Hybride essence rechargeable • Auto. _2020_"
  const parts = h3.split("•").map((s) => s.trim());
  const titre = parts[0]?.trim() || null;

  // Carburant
  let carburant = null;
  if (/électrique|electric/i.test(h3)) carburant = "Électrique";
  else if (/hybride|micro-hybride/i.test(h3)) carburant = "Hybride";
  else if (/diesel/i.test(h3)) carburant = "Diesel";
  else if (/essence/i.test(h3)) carburant = "Essence";
  else if (/gpl/i.test(h3)) carburant = "GPL";

  // Boite: "Auto." = Automatique sur Aramisauto
  let boite = null;
  if (/automatique|auto\./i.test(h3)) boite = "Automatique";
  else if (/manuelle/i.test(h3)) boite = "Manuelle";

  // Année: 4 chiffres 2000-2030
  const anneeMatch = h3.match(/\b(20[0-2]\d)\b/);
  const annee = anneeMatch ? parseInt(anneeMatch[1]) : null;

  // KM: exclure "XXkm WLTP" qui est l'autonomie électrique, pas le kilométrage réel
  const kmMatch = h3.match(/(\d[\d\s]{0,6})\s*km(?!\s*WLTP)/i);
  const km = kmMatch ? parseInt(kmMatch[1].replace(/\s/g, "")) : null;

  // Puissance: 1) "136ch" ou "100ch" directement collé
  let puissance = null;
  const pvCh = h3.match(/\b(\d{2,3})ch\b/i);
  if (pvCh) {
    puissance = pvCh[1] + " ch";
  } else {
    // 2) Nombre avant code boite: "225 e-EAT8", "100 BVM6", "145 e-DCS6"
    const pvGear = titre?.match(/\b(\d{2,3})\s+(?:e-)?(?:BVM|EAT|DCT|EDC|DSG|CVT|AMT|DCS)\d*/i);
    if (pvGear) {
      puissance = pvGear[1] + " ch";
    } else {
      // 3) Dernier nombre 50-700 dans le titre, pas suivi de "." (décimales) ni "kW"
      const nums = [...(titre || "").matchAll(/\b(\d{2,3})\b(?!\.)(?!\s*k[Ww])/g)];
      for (const m of [...nums].reverse()) {
        const n = parseInt(m[1]);
        if (n >= 50 && n <= 700) { puissance = n + " ch"; break; }
      }
    }
  }

  return { titre, carburant, boite, annee, km, puissance };
}

async function extraireAnnonces(page) {
  return page.evaluate(() => {
    const liens = Array.from(
      document.querySelectorAll('a[href*="/voitures/"]')
    ).filter((a) => /\/rv\d+/.test(a.href));

    return liens.map((a) => {
      const h3 = a.querySelector("h3")?.textContent.trim() || "";

      // Tout le texte de la carte pour chercher le km réel (y compris voitures électriques)
      const allText = a.textContent || "";

      // Prix: cherche dans tout le texte de la carte
      // On prend le premier montant entre 1000 et 200000€ (exclut les mensualités ~100-500€)
      let prix = null;
      for (const m of allText.matchAll(/(\d[\d\s]{1,8})\s*€/g)) {
        const val = parseInt(m[1].replace(/\s/g, ""));
        if (val >= 1000 && val <= 200000) { prix = val; break; }
      }

      // km réel: cherche dans tout le texte de la carte, exclut "km WLTP"
      // Les voitures électriques ont le vrai km ailleurs que dans le h3
      let kmCard = null;
      const allKmMatches = [...allText.matchAll(/(\d[\d\s]{0,6})\s*km(?!\s*WLTP)/gi)];
      for (const m of allKmMatches) {
        const val = parseInt(m[1].replace(/\s/g, ""));
        if (val >= 100 && val <= 500000) { kmCard = val; break; }
      }

      const img = a.querySelector("img")?.src || null;
      const lien = a.href || null;

      const idMatch = lien?.match(/\/rv(\d+)/) || lien?.match(/vehicleId=(\d+)/);
      const vehicleId = idMatch ? idMatch[1] : null;

      return { h3, allText, prix, kmCard, img, lien, vehicleId };
    });
  });
}

async function scraper() {
  console.log(`🚗 Lancement du scraper Aramisauto (${NOMBRE_DE_PAGES} pages)...`);

  const runStartedAt = new Date().toISOString();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "fr-FR",
  });
  const page = await context.newPage();

  try {
    let totalUpserted = 0;

    for (let p = 1; p <= NOMBRE_DE_PAGES; p++) {
      try {
        const url = `https://www.aramisauto.com/achat/occasion/?page=${p}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2000);

        const rawCards = await extraireAnnonces(page);

        if (rawCards.length === 0) {
          console.log(`  ⚠️  Page ${p} vide — fin du scraping.`);
          break;
        }

        let upserted = 0;
        for (const card of rawCards) {
          if (!card.vehicleId || !card.h3) continue;

          const source_id = "aramis_" + card.vehicleId;
          const parsed = parseH3(card.h3);
          if (!parsed.titre) continue;

          // km depuis la carte en entier (fiable), sinon depuis le h3
          const km = card.kmCard ?? parsed.km;

          const { error } = await supabase.from("annonces").upsert(
            {
              source_id,
              titre: parsed.titre,
              prix: card.prix,
              km,
              annee: parsed.annee,
              lieu: null,
              source: "Aramisauto",
              image: card.img,
              images: [card.img].filter(Boolean),
              lien: card.lien,
              carburant: parsed.carburant,
              boite: parsed.boite,
              puissance: parsed.puissance,
              last_scraped_at: runStartedAt,
            },
            { onConflict: "source_id" }
          );
          if (!error) upserted++;
        }

        totalUpserted += upserted;
        console.log(`  ✅ Page ${p}/${NOMBRE_DE_PAGES} — ${upserted} annonces mises à jour (total: ${totalUpserted})`);

      } catch (err) {
        console.log(`  ⚠️  Page ${p} ignorée: ${err.message}`);
      }
    }

    // Supprimer les annonces disparues d'Aramisauto
    console.log("🗑️  Suppression des annonces disparues d'Aramisauto...");
    const { error: deleteError, count } = await supabase
      .from("annonces")
      .delete({ count: "exact" })
      .eq("source", "Aramisauto")
      .lt("last_scraped_at", runStartedAt);
    if (deleteError) console.log("⚠️  Erreur suppression:", deleteError.message);
    else console.log(`✅ ${count ?? "?"} annonces supprimées`);

    console.log(`\n🎉 Terminé ! ${totalUpserted} annonces Aramisauto dans la base.`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
