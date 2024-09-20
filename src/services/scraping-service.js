import puppeteer from 'puppeteer';
import {setTimeout} from "node:timers/promises";
export default class ScrapingService {
    // Otras funciones...

    obtenerProductosDeRopa = async (url) => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const productos = [];

        try {
            const response = await page.goto(url, { waitUntil: 'networkidle2' });
            if (!response.ok()) {
                console.error('Error al cargar la página:', response.status());
                return [];
            }

            // Esperar a que el selector principal de productos esté disponible
            await page.waitForSelector('.vtex-search-result-3-x-galleryItem.vtex-search-result-3-x-galleryItem--normal.vtex-search-result-3-x-galleryItem--list.pa4', { timeout: 5000 });

            // Desplazamiento hasta el final de la página
            let anteriorScroll = 0;
            let scrollActual = 0;

            do {
                // Desplazarse hacia abajo
                scrollActual = await page.evaluate(() => {
                    window.scrollBy(0, window.innerHeight);
                    return document.body.scrollHeight;
                });

                // Esperar un poco para que se carguen más elementos
                await setTimeout(1000);

            } while (scrollActual > anteriorScroll && (anteriorScroll = scrollActual));

            // Obtener productos después de hacer scroll
            const nuevosProductos = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.vtex-search-result-3-x-galleryItem.vtex-search-result-3-x-galleryItem--normal.vtex-search-result-3-x-galleryItem--list.pa4'));
                return items.map(item => ({
                    nombre: item.querySelector('.vtex-product-summary-2-x-productNameContainer.mv0.vtex-product-summary-2-x-nameWrapper.overflow-hidden.c-on-base.f5')?.innerText || 'Sin nombre',
                    precio: item.querySelector('.vtex-product-price-1-x-currencyInteger')?.innerText || 'Sin precio',
                    imagen: item.querySelector('.topperio-product-summary-slider-0-x-image.topperio-product-summary-slider-0-x-loaded')?.src || 'Sin imagen',
                }));
            });

            productos.push(...nuevosProductos); // Agrega todos los productos encontrados

            console.log(productos); // Muestra los productos obtenidos
            return productos;

        } catch (error) {
            console.error('Error durante la evaluación:', error);
            return [];
        } finally {
            await browser.close();
        }
    }
}
