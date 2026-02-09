// Temporary script to scrape terrain layout data from Labrador
import { chromium } from 'playwright';

async function scrapeTerrainLayout() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the 40k layouts page
  await page.goto('https://tabletop.labrador.dev/40k_layouts', {
    waitUntil: 'networkidle'
  });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Try to select Layout 1 / Tipping Point if there's a selector
  console.log('Page loaded');

  // Get the page HTML
  const html = await page.content();

  // Try to find SVG elements
  const svgElements = await page.$$('svg');
  console.log(`Found ${svgElements.length} SVG elements`);

  // Get text content for measurements
  const textElements = await page.$$eval('text, .measurement, [class*="measure"]',
    elements => elements.map(el => ({
      text: el.textContent,
      class: el.className,
      x: el.getAttribute('x'),
      y: el.getAttribute('y')
    }))
  );

  console.log('Text elements:', JSON.stringify(textElements, null, 2));

  // Get all SVG structures - there are multiple SVGs on the page
  const allSvgContent = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('svg')).map((svg, index) => {
      const rects = Array.from(svg.querySelectorAll('rect')).map(rect => ({
        x: rect.getAttribute('x'),
        y: rect.getAttribute('y'),
        width: rect.getAttribute('width'),
        height: rect.getAttribute('height'),
        class: rect.getAttribute('class'),
        fill: rect.getAttribute('fill'),
        stroke: rect.getAttribute('stroke')
      }));

      const paths = Array.from(svg.querySelectorAll('path')).map(path => ({
        d: path.getAttribute('d'),
        class: path.getAttribute('class'),
        fill: path.getAttribute('fill'),
        stroke: path.getAttribute('stroke')
      }));

      const polygons = Array.from(svg.querySelectorAll('polygon')).map(poly => ({
        points: poly.getAttribute('points'),
        class: poly.getAttribute('class'),
        fill: poly.getAttribute('fill'),
        stroke: poly.getAttribute('stroke')
      }));

      const texts = Array.from(svg.querySelectorAll('text')).map(text => ({
        text: text.textContent,
        x: text.getAttribute('x'),
        y: text.getAttribute('y'),
        class: text.getAttribute('class')
      }));

      return {
        index,
        rects,
        paths,
        polygons,
        texts,
        viewBox: svg.getAttribute('viewBox'),
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height')
      };
    });
  });

  console.log('All SVG Content:', JSON.stringify(allSvgContent, null, 2));

  // Take a screenshot
  await page.screenshot({ path: '/Users/will.mitchell/deploy-helper/labrador-screenshot.png' });
  console.log('Screenshot saved');

  await browser.close();
}

scrapeTerrainLayout().catch(console.error);
