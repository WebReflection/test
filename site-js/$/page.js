import {render, html} from '../js/lighterhtml.js';

document.title = 'This is page';

render(document.body, () => html`<p>${document.title}</p>`);
