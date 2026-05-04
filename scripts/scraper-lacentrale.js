const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 300;

async function scraper() {
  console.log(`🚗 Lancement du scraper La Centrale (${NOMBRE_DE_PAGES} pages)...`);

  const runStartedAt = new Date().toISOString();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "fr-FR",
  });
  const page = await context.newPage();

  try {
    await page.goto("https://www.lacentrale.fr/listing?page=1", {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    try {
      await page.waitForSelector('button:has-text("Tout accepter")', { timeout: 8000 });
      await page.click('button:has-text("Tout accepter")');
      console.log("✅ Cookies acceptés");
      await page.waitForTimeout(1500);
    } catch {
      try {
        await page.waitForSelector('button:has-text("Accepter")', { timeout: 5000 });
        await page.click('button:has-text("Accepter")');
        console.log("✅ Cookies acceptés (v2)");
        await page.waitForTimeout(1500);
      } catch {
        console.log("ℹ️ Pas de popup cookie");
      }
    }

    let totalUpserted = 0;

    for (let p = 1; p <= NOMBRE_DE_PAGES; p++) {
      try {
        if (p > 1) {
          await page.goto(`https://www.lacentrale.fr/listing?page=${p}`, {
            waitUntil: "networkidle",
            timeout: 45000,
          });
        }

        // Attendre que les annonces soient chargées par JavaScript
        try {
          await page.waitForSelector('a[href*="/auto-occasion-annonce-"]', { timeout: 15000 });
        } catch {
          // Debug : afficher les premiers liens pour diagnostiquer
          const hrefs = await page.evaluate(() =>
            Array.from(document.querySelectorAll("a[href]"))
              .map(a => a.getAttribute("href"))
              .filter(h => h && h.length > 5)
              .slice(0, 8)
          );
          console.log(`  ⚠️ Page ${p} : aucun lien annonce trouvé. Liens présents:`, hrefs);
          break;
        }

        const annonces = await page.evaluate(() => {
          const seen = new Set();
          const results = [];

          document.querySelectorAll('a[href*="/auto-occasion-annonce-"]').forEach((a) => {
            const href = a.getAttribute("href") || "";
            if (seen.has(href)) return;
            seen.add(href);

            const lien = href.startsWith("http") ? href : "https://www.lacentrale.fr" + href;
            const idMatch = lien.match(/auto-occasion-annonce-([A-Z0-9]+)\.html/i);
            const source_id = idMatch ? "lc_" + idMatch[1] : null;
            if (!source_id) return;

            const text = a.textContent.replace(/\s+/g, " ").trim();

            const titreEl = a.querySelector("h2, h3, [class*='title'], [class*='make'], [class*='label']");
            const titre = titreEl?.textContent.trim() || null;

            const prixMatch = text.match(/(\d[\d\s]{1,8})\s*€/);
            const prix = prixMatch ? parseInt(prixMatch[1].replace(/\s/g, "")) : null;

            const anneeMatch = text.match(/\b(20[0-2]\d|19[89]\d)\b/);
            const annee = anneeMatch ? parseInt(anneeMatch[1]) : null;

            const kmMatch = text.match(/(\d[\d\s]{0,6})\s*km/i);
            const km = kmMatch ? parseInt(kmMatch[1].replace(/\s/g, "")) : null;

            let carburant = null;
            if (/électrique|electrique/i.test(text)) carburant = "Électrique";
            else if (/hybride/i.test(text)) carburant = "Hybride";
            else if (/diesel/i.test(text)) carburant = "Diesel";
            else if (/essence/i.test(text)) carburant = "Essence";
            else if (/gpl/i.test(text)) carburant = "GPL";

            const img = a.querySelector("img")?.src || null;

            const lieuEl = Array.from(a.querySelectorAll("span, p, div")).find((el) =>
              /^\d{5}/.test(el.textContent.trim())
            );
            const lieu = lieuEl
              ? lieuEl.textContent.trim().replace(/^\d{5}\s*/, "").split(",")[0].trim()
              : null;

            results.push({ source_id, titre, prix, annee, km, carburant, img, lien, lieu });
          });

          return results;
        });

        if (p === 1) console.log(`  🔍 Debug page 1: ${annonces.length} annonces trouvées`);

        if (annonces.length === 0) {
          console.log(`  ⚠️ Page ${p} vide — fin du scraping.`);
          break;
        }

        let upserted = 0;
        for (const item of annonces) {
          if (!item.source_id || !item.titre) continue;

          const { error } = await supabase.from("annonces").upsert(
            {
              source_id: item.source_id,
              titre: item.titre,
              prix: item.prix,
              km: item.km,
              annee: item.annee,
              lieu: item.lieu,
              source: "La Centrale",
              image: item.img,
              images: [item.img].filter(Boolean),
              lien: item.lien,
              carburant: item.carburant,
              boite: null,
              puissance: null,
              puissance_cv: null,
              last_scraped_at: runStartedAt,
            },
            { onConflict: "source_id" }
          );
          if (!error) upserted++;
          else if (p === 1) console.log(`  ⚠️ Erreur: ${error.message}`);
        }

        totalUpserted += upserted;
        console.log(`  ✅ Page ${p}/${NOMBRE_DE_PAGES} — ${upserted} annonces (total: ${totalUpserted})`);

      } catch (err) {
        console.log(`  ⚠️ Page ${p} ignorée: ${err.message}`);
      }
    }

    if (totalUpserted > 0) {
      console.log("🗑️ Suppression des annonces disparues de La Centrale...");
      const { error, count } = await supabase
        .from("annonces")
        .delete({ count: "exact" })
        .eq("source", "La Centrale")
        .like("source_id", "lc_%")
        .lt("last_scraped_at", runStartedAt);
      if (error) console.log("⚠️ Erreur suppression:", error.message);
      else console.log(`✅ ${count ?? "?"} annonces supprimées`);
    } else {
      console.log("⚠️ Aucune annonce récupérée — suppression annulée.");
    }

    console.log(`\n🎉 Terminé ! ${totalUpserted} annonces La Centrale dans la base.`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
