const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 100;

async function extraireAnnonces(page) {
  return page.evaluate(() => {
    // Liens vers les annonces individuelles
    const liens = Array.from(
      document.querySelectorAll('a[href*="/a/voiture-occasion/"]')
    ).filter((a) => {
      const href = a.href || "";
      // Exclure les liens de navigation, garder seulement les fiches annonces
      const parts = href.split("/").filter(Boolean);
      return parts.length >= 6; // protocol, domain, a, voiture-occasion, brand, model, id
    });

    // Dédoublonner par href
    const seen = new Set();
    const uniques = liens.filter((a) => {
      if (seen.has(a.href)) return false;
      seen.add(a.href);
      return true;
    });

    return uniques.map((a) => {
      const text = a.textContent || "";
      const allText = text.replace(/\s+/g, " ").trim();

      // Prix
      const prixMatch = allText.match(/(\d[\d\s]{1,8})\s*€/);
      const prix = prixMatch ? parseInt(prixMatch[1].replace(/\s/g, "")) : null;

      // KM
      const kmMatch = allText.match(/(\d[\d\s]{0,6})\s*km/i);
      const km = kmMatch ? parseInt(kmMatch[1].replace(/\s/g, "")) : null;

      // Année
      const anneeMatch = allText.match(/\b(20[0-2]\d|19[89]\d)\b/);
      const annee = anneeMatch ? parseInt(anneeMatch[1]) : null;

      // Carburant
      let carburant = null;
      if (/électrique|electrique/i.test(allText)) carburant = "Électrique";
      else if (/hybride/i.test(allText)) carburant = "Hybride";
      else if (/diesel/i.test(allText)) carburant = "Diesel";
      else if (/essence/i.test(allText)) carburant = "Essence";
      else if (/gpl/i.test(allText)) carburant = "GPL";

      // Image
      const img = a.querySelector("img")?.src || null;

      // Lien
      const lien = a.href || null;

      // source_id depuis l'URL : /a/voiture-occasion/peugeot/3008/1290094491A1KVVOPE3M8
      const idMatch = lien?.match(/\/a\/voiture-occasion\/[^/]+\/[^/]+\/([^/?]+)/);
      const source_id = idMatch ? "pv_" + idMatch[1] : null;

      // Titre : depuis les éléments h2/h3/strong dans la carte, ou depuis l'URL
      const h = a.querySelector("h2, h3, strong, [class*='title'], [class*='name']");
      const urlTitreMatch = lien?.match(/\/a\/voiture-occasion\/([^/]+)\/([^/]+)\//);
      const titre = h?.textContent.trim() ||
        (urlTitreMatch
          ? [urlTitreMatch[1], urlTitreMatch[2]]
              .join(" ")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : null);

      // Lieu : cherche un code postal ou ville
      const lieuMatch = allText.match(/(?:^|\s)(\d{5})\s+([A-Z][A-Za-zÀ-ÿ\s-]+?)(?:\s|$)/);
      const lieu = lieuMatch ? lieuMatch[2].trim() : null;

      return { titre, prix, km, annee, carburant, img, lien, source_id, lieu };
    });
  });
}

async function scraper() {
  console.log(`🚗 Lancement du scraper ParuVendu (${NOMBRE_DE_PAGES} pages)...`);

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
        const url = `https://www.paruvendu.fr/a/voiture-occasion/?page=${p}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(3000);

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
              source: "ParuVendu",
              image: item.img,
              images: [item.img].filter(Boolean),
              lien: item.lien,
              carburant: item.carburant,
              boite: null,
              puissance: null,
              last_scraped_at: runStartedAt,
            },
            { onConflict: "source_id" }
          );
          if (!error) upserted++;
        }

        totalUpserted += upserted;
        console.log(`  ✅ Page ${p}/${NOMBRE_DE_PAGES} — ${upserted} annonces (total: ${totalUpserted})`);

      } catch (err) {
        console.log(`  ⚠️  Page ${p} ignorée: ${err.message}`);
      }
    }

    // Supprimer les annonces disparues — seulement si le scraping a fonctionné
    if (totalUpserted > 0) {
      console.log("🗑️  Suppression des annonces disparues de ParuVendu...");
      const { error: deleteError, count } = await supabase
        .from("annonces")
        .delete({ count: "exact" })
        .eq("source", "ParuVendu")
        .lt("last_scraped_at", runStartedAt);
      if (deleteError) console.log("⚠️  Erreur suppression:", deleteError.message);
      else console.log(`✅ ${count ?? "?"} annonces supprimées`);
    } else {
      console.log("⚠️  Aucune annonce récupérée — suppression annulée pour éviter de vider la base.");
    }

    console.log(`\n🎉 Terminé ! ${totalUpserted} annonces ParuVendu dans la base.`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
