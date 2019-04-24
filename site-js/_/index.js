import {title, content} from '../js/module.js';

document.title = title;

import {render, html} from 'https://unpkg.com/lighterhtml?module';

render(document.body, () => content(html));
