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
    return Array.from(document.querySelectorAll("article")).map((article) => {
      const make = article.querySelector("h2")?.textContent.trim() || "";
      const version = article.querySelector("h3")?.textContent.trim() || "";
      const titre = (make + " " + version).trim() || "Inconnu";

      const prixEl = Array.from(article.querySelectorAll("p")).find(
        (p) => p.textContent.includes("€") && p.className.includes("font-semibold")
      );
      const prixText = prixEl?.textContent.trim() || "";
      const prix = prixText ? parseInt(prixText.replace(/[^0-9]/g, "")) : null;

      const spans = Array.from(article.querySelectorAll("span.ml-1"));
      const details = spans.map((s) => s.textContent.trim());
      const annee = details[0] ? parseInt(details[0]) : null;
      const km = details[1] ? parseInt(details[1].replace(/[^0-9]/g, "")) : null;
      const carburant = details[2] || null;
      const boite = details[3] || null;
      const lieu = details[4] || null;

      const imgEl = article.querySelector("img");
      const imgSrc = imgEl?.src || "";
      let image = imgSrc;
      if (imgSrc.includes("_next/image?url=")) {
        try {
          image = decodeURIComponent(new URL(imgSrc).searchParams.get("url") || imgSrc);
        } catch (e) {}
      }

      const linkEl =
        article.querySelector("a[href*='/fiche']") ||
        article.querySelector("a[href*='/fiche-mixte']");
      const lien = linkEl?.href || null;

      // Extraire la puissance depuis le nom (ex: "90ch" ou "145 ch")
      const puissanceMatch = version.match(/(\d+)\s*ch/i);
      const puissance = puissanceMatch ? puissanceMatch[1] + " ch" : null;

      return { titre, prix, annee, km, carburant, boite, lieu, image, lien, puissance };
    });
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

        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1500);

        const listings = await extraireAnnonces(page);

        if (listings.length === 0) {
          console.log(`  ⚠️  Page ${p} vide — fin du scraping.`);
          break;
        }

        let upserted = 0;
        for (const item of listings) {
          if (!item.lien) continue;

          // Extraire l'ID unique depuis l'URL (dernier nombre)
          const idMatch = item.lien.match(/(\d+)$/);
          if (!idMatch) continue;
          const source_id = "autosphere_" + idMatch[1];

          const { error } = await supabase.from("annonces").upsert(
            {
              source_id,
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

    // Supprimer les annonces qui n'existent plus sur Autosphere
    console.log("🗑️  Suppression des annonces disparues d'Autosphere...");
    const { error: deleteError, count } = await supabase
      .from("annonces")
      .delete({ count: "exact" })
      .eq("source", "Autosphere")
      .lt("last_scraped_at", runStartedAt);
    if (deleteError) console.log("⚠️  Erreur suppression:", deleteError.message);
    else console.log(`✅ ${count ?? "?"} annonces supprimées (vendues ou retirées)`);

    console.log(`\n🎉 Terminé ! ${totalUpserted} annonces Autosphere dans la base.`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
