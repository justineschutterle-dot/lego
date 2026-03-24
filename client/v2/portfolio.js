// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}" target="_blank">${deal.title}</a>
        <span>${deal.price}</span>
        <button class="favorite-btn" data-id="${deal.uuid}">⭐ Favorite</button>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

// Feature 1 - Browse pages
selectPage.addEventListener('change', async (event) => {
  const deals = await fetchDeals(parseInt(event.target.value), parseInt(selectShow.value));
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

// Feature 2 - Filter by best discount
document.querySelector('#filter-discount').addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.discount > 50);
  renderDeals(filteredDeals);
});

// Feature 3 - Filter by most commented
document.querySelector('#filter-commented').addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.comments > 15);
  renderDeals(filteredDeals);
});

// Feature 4 - Filter by hot deals
document.querySelector('#filter-hot').addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.temperature > 100);
  renderDeals(filteredDeals);
});

// Feature 5 - Sort
document.querySelector('#sort-select').addEventListener('change', (event) => {
  let sortedDeals = [...currentDeals];

  if (event.target.value === 'price-asc') {
    sortedDeals.sort((a, b) => a.price - b.price);
  } else if (event.target.value === 'price-desc') {
    sortedDeals.sort((a, b) => b.price - a.price);
  } else if (event.target.value === 'date-asc') {
    sortedDeals.sort((a, b) => a.published - b.published);
  } else if (event.target.value === 'date-desc') {
    sortedDeals.sort((a, b) => b.published - a.published);
  }

  renderDeals(sortedDeals);
});

// Feature 7 - Display Vinted sales
const fetchSales = async (id) => {
  const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);
  const body = await response.json();
  if (body.success !== true) return [];
  return body.data.result;
};

const renderSales = sales => {
  const section = document.querySelector('#sales');
  const template = sales.map(sale => `
    <div class="sale">
      <a href="${sale.link}" target="_blank">${sale.title}</a>
      <span>${sale.price.amount}€</span>
    </div>
  `).join('');
  section.innerHTML = '<h2>Sales</h2>' + template;

  // Feature 8 - Number of sales
  document.querySelector('#nbSales').innerHTML = sales.length;

  // Feature 9 - p5, p25, p50
  const prices = sales.map(s => parseFloat(s.price.amount)).sort((a, b) => a - b);
  const p5 = prices[Math.floor(prices.length * 0.05)];
  const p25 = prices[Math.floor(prices.length * 0.25)];
  const p50 = prices[Math.floor(prices.length * 0.50)];

  document.querySelector('#p5').innerHTML = p5 || 0;
  document.querySelector('#p25').innerHTML = p25 || 0;
  document.querySelector('#p50').innerHTML = p50 || 0;

  // Feature 10 - Lifetime value
  const dates = sales.map(s => new Date(s.published)).sort((a, b) => a - b);
  const lifetime = Math.round((dates[dates.length-1] - dates[0]) / (1000 * 60 * 60 * 24));
  document.querySelector('#lifetime').innerHTML = lifetime + ' days';
};

selectLegoSetIds.addEventListener('change', async (event) => {
  const sales = await fetchSales(event.target.value);
  renderSales(sales);
});
// Feature 13 - Save as favorite
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('favorite-btn')) {
    const id = event.target.dataset.id;
    if (!favorites.includes(id)) {
      favorites.push(id);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      alert('Deal saved as favorite!');
    }
  }
});

// Feature 14 - Filter by favorites
document.querySelector('#filter-favorites').addEventListener('click', () => {
  const favoritedDeals = currentDeals.filter(deal => favorites.includes(deal.uuid));
  renderDeals(favoritedDeals);
});