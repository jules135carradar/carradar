const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 100;

async function scraper() {
  console.log(`🚗 Lancement du scraper LeBonCoin (${NOMBRE_DE_PAGES} pages)...`);

  const runStartedAt = new Date().toISOString();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "fr-FR",
    extraHTTPHeaders: { "Accept-Language": "fr-FR,fr;q=0.9" },
  });
  const page = await context.newPage();

  try {
    await page.goto("https://www.leboncoin.fr/recherche?category=2&page=1", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    try {
      await page.waitForSelector('button:has-text("Tout accepter")', { timeout: 8000 });
      await page.click('button:has-text("Tout accepter")');
      console.log("✅ Cookies acceptés");
      await page.waitForTimeout(2000);
    } catch {
      console.log("ℹ️ Pas de popup cookie");
    }

    let totalUpserted = 0;

    for (let p = 1; p <= NOMBRE_DE_PAGES; p++) {
      try {
        if (p > 1) {
          await page.goto(`https://www.leboncoin.fr/recherche?category=2&page=${p}`, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await page.waitForTimeout(2500);
        }

        // Essayer d'abord les données JSON embarquées
        const annonces = await page.evaluate(() => {
          // Méthode 1 : données Next.js
          const nextDataEl = document.getElementById("__NEXT_DATA__");
          if (nextDataEl) {
            try {
              const nextData = JSON.parse(nextDataEl.textContent);
              const ads =
                nextData?.props?.pageProps?.searchData?.ads ||
                nextData?.props?.pageProps?.ads ||
                [];
              if (ads.length > 0) {
                return ads.map((ad) => {
                  const attrs = {};
                  (ad.attributes || []).forEach((a) => { attrs[a.key] = a.value; });
                  const listId = ad.list_id || ad.id;
                  return {
                    source_id: listId ? "lbc_" + listId : null,
                    titre: ad.subject || null,
                    prix: ad.price?.[0] || null,
                    annee: attrs.regdate ? parseInt(attrs.regdate) : null,
                    km: attrs.mileage ? parseInt(attrs.mileage) : null,
                    carburant: attrs.fuel_vehicle || null,
                    boite: attrs.gearbox || null,
                    img: ad.images?.thumb_url || ad.images?.urls?.[0] || null,
                    lien: ad.url || (listId ? "https://www.leboncoin.fr/ad/voitures/" + listId : null),
                    lieu: ad.location?.city || null,
                  };
                }).filter(a => a.source_id);
              }
            } catch (e) {}
          }

          // Méthode 2 : scraping HTML
          const seen = new Set();
          const results = [];

          document.querySelectorAll('a[href*="/ad/voitures/"]').forEach((a) => {
            const href = a.getAttribute("href") || "";
            if (!href.includes("/ad/voitures/")) return;
            if (seen.has(href)) return;
            seen.add(href);

            const lien = href.startsWith("http") ? href : "https://www.leboncoin.fr" + href;
            const idMatch = lien.match(/\/ad\/voitures\/(\d+)/);
            const source_id = idMatch ? "lbc_" + idMatch[1] : null;
            if (!source_id) return;

            const text = a.textContent.replace(/\s+/g, " ").trim();
            const titreEl = a.querySelector("h2, h3, p[class*='title']");
            const titre = titreEl?.textContent.trim() || null;
            if (!titre) return;

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

            results.push({ source_id, titre, prix, annee, km, carburant, img, lien, lieu: null, boite: null });
          });

          return results;
        });

        if (p === 1) console.log(`  🔍 Debug page 1: ${annonces.length} annonces trouvées`);

        if (annonces.length === 0) {
          console.log(`  ⚠️ Page ${p} vide ou bloquée — fin du scraping.`);
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
              source: "LeBonCoin",
              image: item.img,
              images: [item.img].filter(Boolean),
              lien: item.lien,
              carburant: item.carburant,
              boite: item.boite,
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
      console.log("🗑️ Suppression des annonces disparues de LeBonCoin...");
      const { error, count } = await supabase
        .from("annonces")
        .delete({ count: "exact" })
        .eq("source", "LeBonCoin")
        .like("source_id", "lbc_%")
        .lt("last_scraped_at", runStartedAt);
      if (error) console.log("⚠️ Erreur suppression:", error.message);
      else console.log(`✅ ${count ?? "?"} annonces supprimées`);
    } else {
      console.log("⚠️ Aucune annonce récupérée — suppression annulée.");
    }

    console.log(`\n🎉 Terminé ! ${totalUpserted} annonces LeBonCoin dans la base.`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
