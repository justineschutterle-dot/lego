import { v5 as uuidv5 } from 'uuid';

const parse = data => {
  const scripts = data.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
  
  for (const script of scripts) {
    if (!script.includes('"threads":[{\"threadId\"')) continue;

    const marker = '"threads":[';
    const arrStart = script.indexOf(marker) + marker.length - 1;
    
    let depth = 0;
    let end = arrStart;
    for (let i = arrStart; i < script.length; i++) {
      if (script[i] === '[') depth++;
      if (script[i] === ']') depth--;
      if (depth === 0) { end = i; break; }
    }

    try {
      const arr = JSON.parse(script.substring(arrStart, end + 1));
      return arr
        .filter(item => item.price !== null && item.price !== undefined)
        .map(item => ({
          title: item.title,
          price: item.price,
          discount: item.priceDiscount,
          temperature: item.temperature,
          photo: item.mainImage ? `https://static-pepper.dealabs.com/${item.mainImage.path}/${item.mainImage.name}_1.jpg` : undefined,
          link: item.url,
          'uuid': uuidv5(item.url, uuidv5.URL)
        }));
    } catch(e) {
      console.error('Parse error:', e.message);
    }
  }
  
  return [];
};

const scrape = async url => {
  const response = await fetch(url);
  if (response.ok) {
    const body = await response.text();
    return parse(body);
  }
  console.error(response);
  return null;
};

export { scrape };