import {render, html} from '../js/lighterhtml.js';
import {title, content} from '../js/module.js';

document.title = title;

render(document.body, () => content(html));
