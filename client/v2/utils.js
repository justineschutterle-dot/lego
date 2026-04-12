'use strict';

const getIdsFromDeals = deals => {
  return deals
    .map(deal => {
      // Extrait le numéro du set depuis le titre (ex: "76784" depuis "LEGO Mercredi 76784")
      const match = deal.title.match(/\d{4,6}/);
      return match ? match[0] : null;
    })
    .filter(id => id !== null);
};