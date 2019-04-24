import {render, html} from 'https://unpkg.com/lighterhtml?module';

document.title = 'This is page';

render(document.body, () => html`<p>${document.title}</p>`);
