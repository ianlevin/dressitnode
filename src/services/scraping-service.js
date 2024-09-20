import puppeteer from 'puppeteer';
import {setTimeout} from "node:timers/promises";
import ScrapingRepository from "../repositories/scraping-repository.js";
export default class ScrapingService {
    agregarNike = async (data) => {
        const repo = new ScrapingRepository();
        let returnArray = await repo.agregarNike(data);
        return returnArray;
    }

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
            console.log("a")
            // Obtener productos después de hacer scroll
            const nuevosProductos = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.vtex-search-result-3-x-galleryItem.vtex-search-result-3-x-galleryItem--normal.vtex-search-result-3-x-galleryItem--list.pa4'));
                return items.map(item => ({
                    img: item.querySelector('.topperio-product-summary-slider-0-x-image.topperio-product-summary-slider-0-x-loaded')?.src || 'Sin imagen',
                    link: document.querySelector('.vtex-product-summary-2-x-clearLink.vtex-product-summary-2-x-clearLink--product-card.h-100.flex.flex-column')?.href || 'Sin enlace',
                    title: item.querySelector('.vtex-product-summary-2-x-productNameContainer.mv0.vtex-product-summary-2-x-nameWrapper.overflow-hidden.c-on-base.f5')?.innerText || 'Sin nombre',
                    descripcion: "",
                    precio: (item.querySelector('.vtex-product-price-1-x-currencyInteger')?.innerText || 'Sin precio')+"000"
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
