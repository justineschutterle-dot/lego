import * as dealabs from './websites/dealabs.js';
import * as fs from 'fs';

async function scrapeDealabs(url = 'https://www.dealabs.com/groupe/lego') {
  try {
    console.log(`🕵️ browsing ${url}`);
    const deals = await dealabs.scrape(url);
    console.log(`✅ ${deals.length} deals trouvés`);
    console.log(deals);
    fs.writeFileSync('./sources/deals.json', JSON.stringify(deals, null, 2));
    console.log('💾 Sauvegardé dans sources/deals.json');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

scrapeDealabs();