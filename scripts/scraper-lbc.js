const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 50; // 50 pages x 20 annonces = 1000 annonces

async function scraperPage(page, numero) {
  const url = `https://www.autoscout24.fr/lst?atype=C&cy=F&size=20&page=${numero}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

  const nextData = await page.evaluate(() => {
    const el = document.getElementById("__NEXT_DATA__");
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch { return null; }
  });

  if (!nextData) return [];

  return (
    nextData?.props?.pageProps?.listings ||
    nextData?.props?.pageProps?.ads ||
    []
  );
}

async function scraper() {
  console.log(`🚗 Lancement du scraper AutoScout24 (${NOMBRE_DE_PAGES} pages)...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "fr-FR",
  });
  const page = await context.newPage();

  try {
    // Supprimer les anciennes annonces avant de réinsérer
    console.log("🗑️  Suppression des anciennes annonces AutoScout24...");
    const { error: deleteError } = await supabase.from("annonces").delete().eq("source", "AutoScout24");
    if (deleteError) console.log("⚠️  Erreur suppression:", deleteError.message);
    else console.log("✅ Anciennes annonces supprimées");

    // Première page + accepter cookies
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

    let totalSaved = 0;

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

        let saved = 0;
        for (const item of listings) {
          const titre = [item.vehicle?.make, item.vehicle?.model].filter(Boolean).join(" ") || "Inconnu";
          const prix = item.tracking?.price ? parseInt(item.tracking.price) : null;
          const km = item.tracking?.mileage ? parseInt(item.tracking.mileage) : null;
          const anneeStr = item.tracking?.firstRegistration;
          const annee = anneeStr ? parseInt(anneeStr.split("-").pop()) : null;
          const lieu = item.location?.city || null;
          const lien = item.url ? "https://www.autoscout24.fr" + item.url : null;
          const image = item.images?.[0] || null;

          const carburant = item.vehicle?.fuel || null;
          const boite = item.vehicle?.transmission || null;
          const images = item.images || [];
          const description = item.vehicle?.modelVersionInput || null;
          const puissanceDetail = (item.vehicleDetails || []).find(d => d.ariaLabel === "Puissance kW (CH)");
          const puissance = puissanceDetail?.data || null;

          const { error } = await supabase.from("annonces").insert({
            titre, prix, km, annee, lieu,
            source: "AutoScout24",
            image, lien,
            images, carburant, boite, description, puissance,
          });

          if (!error) saved++;
        }

        totalSaved += saved;
        console.log(`  ✅ Page ${p}/${NOMBRE_DE_PAGES} — ${saved} annonces sauvegardées (total: ${totalSaved})`);

      } catch (err) {
        console.log(`  ⚠️  Page ${p} ignorée: ${err.message}`);
      }
    }

    console.log(`\n🎉 Terminé ! ${totalSaved} annonces au total dans la base de données.`);
    console.log("Rafraîchis ton site pour les voir !");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
