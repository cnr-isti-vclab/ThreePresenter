import { DEFAULT_UI_SKIN_SVG } from './DefaultSkinSvg';

export class ThreePresenterSkin {
  private static url: string | null = null;
  private static svgText: string = DEFAULT_UI_SKIN_SVG;
  private static svg: SVGSVGElement | null = null;
  private static loadPromise: Promise<void> | null = null;
  private static readonly fallbackViewBox = '0 0 24 24';
  private static readonly iconSize = '1.25rem';
  private static readonly pad = 5; // matches OpenLIME Skin.pad

  static setUrl(url: string): void {
    this.url = url;
    this.svg = null;
    this.loadPromise = null;
  }

  static setSvgText(svgText: string): void {
    this.url = null;
    this.svgText = svgText;
    this.svg = null;
    this.loadPromise = null;
  }

  static resetDefault(): void {
    this.setSvgText(DEFAULT_UI_SKIN_SVG);
  }

  static async getElement(selector: string): Promise<SVGElement> {
    await this.ensureSvg();

    const element = this.svg?.querySelector(selector);
    if (!element) {
      throw new Error(`ThreePresenterSkin: selector not found: ${selector}`);
    }

    return element.cloneNode(true) as SVGElement;
  }

  static async createIcon(selector: string): Promise<SVGSVGElement> {
    const element = await this.getElement(selector);
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrapper.setAttribute('class', 'tp-ui-skin-icon');
    wrapper.setAttribute('width', this.iconSize);
    wrapper.setAttribute('height', this.iconSize);
    wrapper.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    wrapper.style.display = 'block';

    // Wrap the glyph in a neutral (transform-free) group and measure THAT, so the
    // glyph's own transform is included in the bounds and the viewBox frames it
    // correctly (measuring the glyph directly ignores its own transform).
    const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    contentGroup.appendChild(element);
    wrapper.appendChild(contentGroup);

    const viewBox = this.computeViewBox(wrapper, contentGroup);
    wrapper.setAttribute('viewBox', viewBox);

    return wrapper;
  }

  static async applyIcon(container: HTMLElement, selector: string): Promise<void> {
    const icon = await this.createIcon(selector);
    container.replaceChildren(icon);
  }

  private static async ensureSvg(): Promise<void> {
    if (this.svg) {
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = this.loadSvg();
    }

    await this.loadPromise;
  }

  private static async loadSvg(): Promise<void> {
    const svgText = this.url ? await this.fetchSvgText(this.url) : this.svgText;
    const parser = new DOMParser();
    const parsed = parser.parseFromString(svgText, 'image/svg+xml').documentElement;

    if (!(parsed instanceof SVGSVGElement)) {
      throw new Error('ThreePresenterSkin: invalid SVG document');
    }

    this.svg = parsed;
  }

  private static async fetchSvgText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ThreePresenterSkin: failed loading ${url}: ${response.statusText}`);
    }

    return response.text();
  }

  private static computeViewBox(wrapper: SVGSVGElement, contentGroup: SVGGElement): string {
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.left = '-99999px';
    temp.style.top = '-99999px';
    temp.style.width = '0';
    temp.style.height = '0';
    temp.style.overflow = 'hidden';
    temp.style.pointerEvents = 'none';
    temp.appendChild(wrapper);
    document.body.appendChild(temp);

    try {
      // Measuring the neutral wrapper group includes the glyph's own transform,
      // giving bounds in the wrapper's coordinate system that the viewBox can frame.
      const box = contentGroup.getBBox();

      if (Number.isFinite(box.width) && Number.isFinite(box.height) && box.width > 0 && box.height > 0) {
        const pad = this.pad;
        return `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`;
      }
    } catch (error) {
      console.warn('ThreePresenterSkin: could not compute icon bounds, using fallback viewBox', error);
    } finally {
      temp.remove();
    }

    return this.fallbackViewBox;
  }
}
