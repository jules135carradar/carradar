const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NOMBRE_DE_PAGES = 100; // ~2500 annonces
const FUELS = ["Essence", "Diesel", "Hybride", "Électrique", "GPL", "Gpl", "Hydrogène"];
const SOURCE_MAP = {
  autoscout24: "AutoScout24",
  leboncoin: "LeBonCoin",
  "la centrale": "La Centrale",
  autosphere: "Autosphere",
  aramisauto: "Aramisauto",
  paruvendu: "ParuVendu",
};

function extraireAnnonces(cards) {
  return cards.map((card) => {
    const h3 = card.h3 || "";
    const titre = h3
      .replace(/^(?:Occasion|Nouvelle?)\s*\(\d{4}\)\s*/i, "")
      .replace(/\s*\|.*$/, "")
      .trim();

    const lis = card.lis || [];
    const anneeMatch = (lis[0] || "").match(/\d{4}/);
    const annee = anneeMatch ? parseInt(anneeMatch[0]) : null;
    const km = lis[1] ? parseInt(lis[1].replace(/[^0-9]/g, "")) : null;

    const carburantLi = lis.find((li) => FUELS.some((f) => li.includes(f)));
    const carburant = carburantLi
      ? carburantLi.replace(/^\d+[\.,]\d+L\s*/, "")
      : null;
    const boite =
      lis.find((li) => /^(Automatique|Manuelle)$/i.test(li)) || null;
    const puissanceLi = lis.find(
      (li) => /\d+\s*ch/i.test(li) && !/\d+\s*km/.test(li)
    );
    const puissance = puissanceLi
      ? puissanceLi.match(/(\d+)\s*ch/i)?.[1] + " ch"
      : null;

    const prix = card.prix || null;
    const sourceRaw = (card.source || "AutoUncle").toLowerCase();
    const source = SOURCE_MAP[sourceRaw] || card.source || "AutoUncle";
    const lieu = card.lieu || null;
    const img = card.img || null;
    const lien = card.lien || null;

    const idMatch = lien?.match(/\/d\/(\d+)-/);
    const source_id = idMatch ? "au_" + idMatch[1] : null;

    return { titre, prix, annee, km, carburant, boite, puissance, source, lieu, img, lien, source_id };
  });
}

async function scraper() {
  console.log(`🚗 Lancement du scraper AutoUncle (${NOMBRE_DE_PAGES} pages)...`);

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
        const url = `https://www.autouncle.fr/fr/voitures-occasion?page=${p}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2500);

        const rawCards = await page.evaluate((FUELS) => {
          return Array.from(document.querySelectorAll("article")).map((card) => {
            const h3 = card.querySelector("h3")?.textContent.trim() || "";
            const lis = Array.from(card.querySelectorAll("li")).map((li) => li.textContent.trim());

            const prixEl = Array.from(card.querySelectorAll("div")).find((d) =>
              /^\d[\d\s]{1,8}€$/.test(d.textContent.trim())
            );
            const prixText = prixEl?.textContent.trim() || "";
            const prix = prixText ? parseInt(prixText.replace(/[^0-9]/g, "")) : null;

            const sourceEl = Array.from(card.querySelectorAll("p")).find((p) =>
              /autoscout|leboncoin|centrale|autosphere|aramisauto|paruvendu/i.test(p.textContent)
            );
            const source = sourceEl?.textContent.trim() || "AutoUncle";

            const lieuEl = Array.from(card.querySelectorAll("div")).find((d) =>
              /^\d{5}\s/.test(d.textContent.trim())
            );
            const lieu = lieuEl
              ? lieuEl.textContent.trim().replace(/^\d{5}\s*/, "").split(",")[0]
              : null;

            const img = card.querySelector("img")?.src || null;
            const lien = card.querySelector("a")?.href || null;

            return { h3, lis, prix, source, lieu, img, lien };
          });
        }, FUELS);

        if (rawCards.length === 0) {
          console.log(`  ⚠️  Page ${p} vide — fin du scraping.`);
          break;
        }

        const listings = extraireAnnonces(rawCards);

        let upserted = 0;
        for (const item of listings) {
          if (!item.source_id || !item.titre || item.titre === "Inconnu") continue;

          const { error } = await supabase.from("annonces").upsert(
            {
              source_id: item.source_id,
              titre: item.titre,
              prix: item.prix,
              km: item.km,
              annee: item.annee,
              lieu: item.lieu,
              source: item.source,
              image: item.img,
              images: [item.img].filter(Boolean),
              lien: item.lien,
              carburant: item.carburant,
              boite: item.boite,
              puissance: item.puissance,
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

    // Supprimer les annonces AutoUncle disparues
    console.log("🗑️  Suppression des annonces AutoUncle disparues...");
    const sources = Object.values(SOURCE_MAP).concat(["AutoUncle"]);
    for (const src of sources) {
      const { error } = await supabase
        .from("annonces")
        .delete()
        .eq("source", src)
        .like("source_id", "au_%")
        .lt("last_scraped_at", runStartedAt);
      if (error) console.log(`⚠️  Erreur suppression ${src}:`, error.message);
    }
    console.log("✅ Nettoyage terminé");

    console.log(`\n🎉 Terminé ! ${totalUpserted} annonces AutoUncle dans la base.`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await browser.close();
  }
}

scraper();
