import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import SALES from "./sources/vinted.json" with { type: "json" };
import DEALS from "./sources/deals.json" with { type: "json" };

const PORT = 8092;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

app.get('/', (request, response) => {
  response.send({'ack': true});
});

// GET /deals/search - Search for deals
app.get('/deals/search', (request, response) => {
  try {
    const { limit = 12, price, date, filterBy } = request.query;

    let results = [...DEALS];

    if (price) {
      results = results.filter(d => d.price <= parseFloat(price));
    }

    if (date) {
      const dateTimestamp = new Date(date).getTime() / 1000;
      results = results.filter(d => d.published >= dateTimestamp);
    }

    if (filterBy === 'best-discount') {
      results = results.filter(d => d.discount >= 20);
    } else if (filterBy === 'most-commented') {
      results = results.filter(d => d.comments > 5);
    } else if (filterBy === 'hot-deals') {
      results = results.filter(d => d.temperature > 100);
    }

    results.sort((a, b) => a.price - b.price);
    results = results.slice(0, parseInt(limit));

    return response.status(200).json({
      'limit': parseInt(limit),
      'total': results.length,
      'results': results
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({'success': false});
  }
});

// GET /deals/:id - Fetch a specific deal by uuid
app.get('/deals/:id', (request, response) => {
  try {
    const { id } = request.params;
    const deal = DEALS.find(d => d.uuid === id);

    if (!deal) {
      return response.status(404).json({
        'success': false,
        'data': null
      });
    }

    return response.status(200).json({
      'success': true,
      'data': deal
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({'success': false});
  }
});

// GET /sales/search
app.get('/sales/search', (request, response) => {
  try {
    const { legoSetId, limit = 12 } = request.query;
    let result = SALES[legoSetId] || [];

    // Trie par date décroissante
    result = result.sort((a, b) => b.published - a.published);

    // Limite le nombre de résultats
    result = result.slice(0, parseInt(limit));

    return response.status(200).json({
      'limit': parseInt(limit),
      'total': result.length,
      'results': result
    });
  } catch (error) {
    console.log(error);
    return response.status(404).send({
      'success': false,
      'data': {'result': []}
    });
  }
});

app.listen(PORT);
console.log(`📡 Running on port ${PORT}`);