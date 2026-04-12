'use strict';

let currentDeals = [];
let currentPagination = {};

const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');

const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-server-xi.vercel.app/deals/search?limit=${size}`
    );
    const body = await response.json();
    return {
      result: body.results || [],
      meta: {
        currentPage: page,
        pageCount: Math.ceil((body.total || 0) / size),
        count: body.total || 0
      }
    };
  } catch (error) {
    console.error(error);
    return {result: currentDeals, meta: currentPagination};
  }
};

const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <a href="${deal.link}" target="_blank">${deal.title}</a>
        <span>${deal.price}€</span>
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

const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');
  selectLegoSetIds.innerHTML = options;
};

const renderIndicators = pagination => {
  const {count} = pagination;
  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals);
};

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

selectPage.addEventListener('change', async (event) => {
  const deals = await fetchDeals(parseInt(event.target.value), parseInt(selectShow.value));
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

document.querySelector('#filter-discount').addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.discount > 50);
  renderDeals(filteredDeals);
});

document.querySelector('#filter-commented').addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.comments > 15);
  renderDeals(filteredDeals);
});

document.querySelector('#filter-hot').addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.temperature > 100);
  renderDeals(filteredDeals);
});

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

// API du prof pour les ventes Vinted
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

  document.querySelector('#nbSales').innerHTML = sales.length;

  const prices = sales.map(s => parseFloat(s.price.amount)).sort((a, b) => a - b);
  const p5 = prices[Math.floor(prices.length * 0.05)];
  const p25 = prices[Math.floor(prices.length * 0.25)];
  const p50 = prices[Math.floor(prices.length * 0.50)];

  document.querySelector('#p5').innerHTML = p5 || 0;
  document.querySelector('#p25').innerHTML = p25 || 0;
  document.querySelector('#p50').innerHTML = p50 || 0;

  const dates = sales.map(s => new Date(s.published)).sort((a, b) => a - b);
  const lifetime = Math.round((dates[dates.length-1] - dates[0]) / (1000 * 60 * 60 * 24));
  document.querySelector('#lifetime').innerHTML = lifetime + ' days';
};

selectLegoSetIds.addEventListener('change', async (event) => {
  const sales = await fetchSales(event.target.value);
  renderSales(sales);
});

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

document.querySelector('#filter-favorites').addEventListener('click', () => {
  const favoritedDeals = currentDeals.filter(deal => favorites.includes(deal.uuid));
  renderDeals(favoritedDeals);
});