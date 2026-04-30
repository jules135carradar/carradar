const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 100;

function parseH3(h3) {
  // Format: "Peugeot 2008 1.2 PureTech 100 • Active Essence • Manuelle _2024_ • 29 733 km • Occasion"
  const parts = h3.split("•").map((s) => s.trim());

  const titre = parts[0]?.trim() || null;

  const fuelPart = parts[1] || "";
  let carburant = null;
  if (/électrique|electric/i.test(fuelPart)) carburant = "Électrique";
  else if (/hybride/i.test(fuelPart)) carburant = "Hybride";
  else if (/diesel/i.test(fuelPart)) carburant = "Diesel";
  else if (/essence/i.test(fuelPart)) carburant = "Essence";
  else if (/gpl/i.test(fuelPart)) carburant = "GPL";

  const transmPart = parts[2] || "";
  let boite = null;
  if (/automatique/i.test(transmPart)) boite = "Automatique";
  else if (/manuelle/i.test(transmPart)) boite = "Manuelle";
  const anneeMatch = transmPart.match(/(\d{4})/);
  const annee = anneeMatch ? parseInt(anneeMatch[1]) : null;

  const kmPart = parts[3] || "";
  const kmMatch = kmPart.match(/(\d[\d\s]*)\s*km/i);
  const km = kmMatch ? parseInt(kmMatch[1].replace(/\s/g, "")) : null;

  return { titre, carburant, boite, annee, km };
}

async function extraireAnnonces(page) {
  return page.evaluate(() => {
    const liens = Array.from(
      document.querySelectorAll('a[href*="/voitures/"]')
    ).filter((a) => /\/rv\d+/.test(a.href));

    return liens.map((a) => {
      const h3 = a.querySelector("h3")?.textContent.trim() || "";

      // Prix: chercher le premier "XX XXX €" dans les paragraphes
      const pTexts = Array.from(a.querySelectorAll("p")).map((p) =>
        p.textContent.trim()
      );
      let prix = null;
      for (const t of pTexts) {
        const m = t.match(/^(\d[\d\s]{1,8})€/);
        if (m) {
          prix = parseInt(m[1].replace(/\s/g, ""));
          break;
        }
      }

      const img = a.querySelector("img")?.src || null;
      const lien = a.href || null;

      // vehicleId depuis URL: /voitures/.../rv123456/ ou ?vehicleId=123456
      const idMatch = lien?.match(/\/rv(\d+)/) || lien?.match(/vehicleId=(\d+)/);
      const vehicleId = idMatch ? idMatch[1] : null;

      return { h3, prix, img, lien, vehicleId };
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

          const { error } = await supabase.from("annonces").upsert(
            {
              source_id,
              titre: parsed.titre,
              prix: card.prix,
              km: parsed.km,
              annee: parsed.annee,
              lieu: null,
              source: "Aramisauto",
              image: card.img,
              images: [card.img].filter(Boolean),
              lien: card.lien,
              carburant: parsed.carburant,
              boite: parsed.boite,
              puissance: null,
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
