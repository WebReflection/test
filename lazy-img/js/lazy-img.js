customElements.define(
  'lazy-img',
  class extends HTMLImageElement {
    static get observedAttributes() { return ['data-src']; }
    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'data-src') {
        if (!oldVal)
          this.setAttribute('loading', 'lazy');
        this.src = newVal;
      }
    }
  },
  {extends: 'img'}
);