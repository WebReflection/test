addEventListener('fetch', event => {
  const {request} = event;
  const {hostname, pathname} = new URL(request.url);
  if (hostname === location.hostname && /\/_\//.test(pathname))
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        return response.text().then(js => {
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta name="viewport" content="width=device-width,initial-scale=1.0">
              </head>
            </html>
            <script type="module">${js}</script>`,
            {
              status: 200,
              headers: {'Content-Type': 'text/html;charset=utf-8'}
            }
          );
        });
      } else {
        return new Response('Not found', {status: 404});
      }
    }));
});
