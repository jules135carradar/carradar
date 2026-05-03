const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 50;

async function scraper() {
  console.log(`🚗 Lancement du scraper AutoScout24 (${NOMBRE_DE_PAGES} pages)...`);

  const runStartedAt = new Date().toISOString();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "fr-FR",
  });
  const page = await context.newPage();

  try {
    // Accepter les cookies sur la première page
    console.log("📡 Ouverture de la page 1...");
    await page.goto("https://www.autoscout24.fr/lst?atype=C&cy=F&size=20&page=1", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    try {
      await page.waitForSelector('button:has-text("Accepter tout")', { timeout: 8000 });
      await page.click('button:has-text("Accepter tout")');
      console.log("✅ Cookie accepté");
      await page.waitForTimeout(2000);
    } catch {
      console.log("ℹ️  Pas de popup cookie");
    }

    let totalUpserted = 0;

    for (let p = 1; p <= NOMBRE_DE_PAGES; p++) {
      try {
        if (p > 1) {
          await page.goto(`https://www.autoscout24.fr/lst?atype=C&cy=F&size=20&page=${p}`, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await page.waitForTimeout(1500);
        }

        const nextData = await page.evaluate(() => {
          const el = document.getElementById("__NEXT_DATA__");
          if (!el) return null;
          try { return JSON.parse(el.textContent); } catch { return null; }
        });

        const listings = nextData?.props?.pageProps?.listings || nextData?.props?.pageProps?.ads || [];

        if (listings.length === 0) {
          console.log(`  ⚠️  Page ${p} vide — fin du scraping.`);
          break;
        }

        let upserted = 0;
        for (const item of listings) {
          if (!item.id) continue;

          const source_id = "as24_" + item.id;
          const titre = [item.vehicle?.make, item.vehicle?.model].filter(Boolean).join(" ") || "Inconnu";
          const prix = item.tracking?.price ? parseInt(item.tracking.price) : null;
          const km = item.tracking?.mileage ? parseInt(item.tracking.mileage) : null;
          const anneeStr = item.tracking?.firstRegistration;
          const annee = anneeStr ? parseInt(anneeStr.split("-").pop()) : null;
          const lieu = item.location?.city || null;
          const lien = item.url ? "https://www.autoscout24.fr" + item.url : null;
          const image = item.images?.[0] || null;
          const images = item.images || [];
          const carburant = item.vehicle?.fuel || null;
          const boite = item.vehicle?.transmission || null;
          const description = item.vehicle?.modelVersionInput || null;
          const puissanceDetail = (item.vehicleDetails || []).find(d => d.ariaLabel === "Puissance kW (CH)");
          const puissance = puissanceDetail?.data || null;

          const puissance_cv = puissance ? (parseInt(puissance) || null) : null;
          const { error } = await supabase.from("annonces").upsert(
            { source_id, titre, prix, km, annee, lieu, source: "AutoScout24", image, lien, images, carburant, boite, description, puissance, puissance_cv, last_scraped_at: runStartedAt },
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

    // Supprimer les annonces qui n'existent plus sur AutoScout24
    console.log("🗑️  Suppression des annonces disparues d'AutoScout24...");
    const { error: deleteError, count } = await supabase
      .from("annonces")
      .delete({ count: "exact" })
      .eq("source", "AutoScout24")
      .lt("last_scraped_at", runStartedAt);
    if (deleteError) console.log("⚠️  Erreur suppression:", deleteError.message);
    else console.log(`✅ ${count ?? "?"} annonces supprimées (vendues ou retirées)`);

    console.log(`\n🎉 Terminé ! ${totalUpserted} annonces AutoScout24 dans la base.`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
