const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 50;

async function extraireAnnonces(page) {
  return page.evaluate(() => {
    const CARBURANTS = ["Essence", "Diesel", "Hybride", "Électrique", "GPL", "Hydrogène"];

    // Le site utilise maintenant des liens /fiche-mixte/ ou /fiche/ pour chaque carte
    const seen = new Set();
    const results = [];

    // Debug : montrer les premiers hrefs pour diagnostiquer
    const allHrefs = Array.from(document.querySelectorAll("a[href]"))
      .map(a => a.getAttribute("href"))
      .filter(h => h && h.length > 10 && !h.startsWith("#"))
      .slice(0, 10);
    console.log("DEBUG hrefs:", allHrefs);

    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      // Accepter les liens vers les fiches voiture (plusieurs formats possibles)
      const estFicheVoiture =
        href.includes("/fiche") ||
        href.includes("/vehicules/") ||
        href.includes("/occasion/") ||
        /\/[a-z-]+-\d{5,}/.test(href);  // slug + ID numérique long
      if (!estFicheVoiture) return;
      if (seen.has(href)) return;
      seen.add(href);

      const lien = href.startsWith("http") ? href : "https://www.autosphere.fr" + href;

      // Remonter au conteneur de la carte (cherche h3 dans les parents)
      let card = a.parentElement;
      for (let i = 0; i < 6; i++) {
        if (card?.querySelector("h3")) break;
        card = card?.parentElement;
      }
      if (!card?.querySelector("h3")) return;

      // Image
      const imgEl = a.querySelector("img") || card.querySelector("img");
      let image = imgEl?.src || "";
      if (image.includes("_next/image?url=")) {
        try {
          image = decodeURIComponent(new URL(image).searchParams.get("url") || image);
        } catch (e) {}
      }

      // Titre
      const h3 = card.querySelector("h3")?.textContent.trim() || "";
      const h4 = card.querySelector("h4")?.textContent.trim() || "";
      const titre = [h3, h4].filter(Boolean).join(" ") || null;

      // Prix : chercher un <strong> avec uniquement un montant en €
      let prix = null;
      for (const strong of card.querySelectorAll("strong")) {
        const t = strong.textContent.trim();
        const m = t.match(/^([\d\s]+)\s*€$/);
        if (m) {
          const p = parseInt(m[1].replace(/\s/g, ""));
          if (p >= 1000 && p <= 300000) { prix = p; break; }
        }
      }

      // Spans de détails
      const spans = Array.from(card.querySelectorAll("span"))
        .map((s) => s.textContent.trim())
        .filter(Boolean);

      const anneeSpan = spans.find((s) => /^(19|20)\d{2}$/.test(s));
      const annee = anneeSpan ? parseInt(anneeSpan) : null;

      const kmSpan = spans.find((s) => /^\d[\d\s]*\s*km$/i.test(s) && !/WLTP/i.test(s));
      const km = kmSpan ? parseInt(kmSpan.replace(/[^0-9]/g, "")) : null;

      const carburant = spans.find((s) =>
        CARBURANTS.some((c) => s.toLowerCase().includes(c.toLowerCase()))
      ) || null;

      const boite = spans.find((s) => /^automatique$|^manuelle$/i.test(s)) || null;

      const lieu = spans.find((s) =>
        /^[A-ZÀ-Ÿ]/.test(s) &&
        !/^\d/.test(s) &&
        !CARBURANTS.some((c) => s.toLowerCase().includes(c.toLowerCase())) &&
        !/automatique|manuelle/i.test(s)
      ) || null;

      // ID depuis la fin de l'URL
      const idMatch = lien.match(/(\d+)[^0-9]*$/);
      const source_id = idMatch ? "autosphere_" + idMatch[1] : null;

      const puissanceMatch = h4.match(/(\d+)\s*ch/i);
      const puissance = puissanceMatch ? puissanceMatch[1] + " ch" : null;
      const puissance_cv = puissanceMatch ? parseInt(puissanceMatch[1]) : null;

      results.push({ titre, prix, annee, km, carburant, boite, lieu, image: image || null, lien, source_id, puissance, puissance_cv });
    });

    return results.filter((item) => item.source_id && item.titre);
  });
}

async function scraper() {
  console.log(`🚗 Lancement du scraper Autosphere (${NOMBRE_DE_PAGES} pages)...`);

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
        const url = p === 1
          ? "https://www.autosphere.fr/recherche"
          : `https://www.autosphere.fr/recherche?page=${p}`;

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2000);

        const listings = await extraireAnnonces(page);

        if (listings.length === 0) {
          console.log(`  ⚠️  Page ${p} vide — fin du scraping.`);
          break;
        }

        let upserted = 0;
        for (const item of listings) {
          if (!item.source_id || !item.titre) continue;

          const { error } = await supabase.from("annonces").upsert(
            {
              source_id: item.source_id,
              titre: item.titre,
              prix: item.prix,
              km: item.km,
              annee: item.annee,
              lieu: item.lieu,
              source: "Autosphere",
              image: item.image,
              images: [item.image].filter(Boolean),
              lien: item.lien,
              carburant: item.carburant,
              boite: item.boite,
              puissance: item.puissance || null,
              puissance_cv: item.puissance_cv || null,
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

    // Supprimer les annonces disparues — seulement si le scraping a fonctionné
    if (totalUpserted > 0) {
      console.log("🗑️  Suppression des annonces disparues d'Autosphere...");
      const { error: deleteError, count } = await supabase
        .from("annonces")
        .delete({ count: "exact" })
        .eq("source", "Autosphere")
        .lt("last_scraped_at", runStartedAt);
      if (deleteError) console.log("⚠️  Erreur suppression:", deleteError.message);
      else console.log(`✅ ${count ?? "?"} annonces supprimées (vendues ou retirées)`);
    } else {
      console.log("⚠️  Aucune annonce récupérée — suppression annulée pour éviter de vider la base.");
    }

    console.log(`\n🎉 Terminé ! ${totalUpserted} annonces Autosphere dans la base.`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
