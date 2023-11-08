const Koa = require('koa');
const { bodyParser } = require("@koa/bodyparser");

const port = process.env.PORT || 3000;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'

const API_URL_LIST = [
  '/models',
  '/files',
  '/assistants',
  '/chat/completions',
  '/images/generations',
  '/audio/transcriptions',
]

const app = new Koa();
app.use(bodyParser());

const main = async ctx => {
  console.log(ctx.path, ctx.url)
  const isInUrlList = API_URL_LIST.some(url => url.startsWith(ctx.path))
  if (ctx.path === '/') {
    ctx.body = 'Hello World!';
  } else if (isInUrlList) {
    const url = `${OPENAI_BASE_URL}${ctx.path}${ctx.request.search}`
    console.debug("[FETCH URL]", url)

    try {
      const response = await fetch(url, {
        method: ctx.method,
        body: ctx.request.body,
        headers: ctx.headers,
        // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
        redirect: "manual",
      })
      console.debug("[FETCH RESPONSE]", response)
      ctx.body = response.body;
      ctx.status = response.status
      ctx.response.headers = response.headers
    } catch (e) {
      console.debug("[FETCH ERROR]", e)
      ctx.status = 500;
      ctx.headers['content-type'] = 'text/plain'
      if (e.cause) {
        ctx.body = e.cause.reason ?? 'Internal Server Error';
      } else {
        ctx.body = 'Internal Server Error';
      }
    }

  } else {
    ctx.body = 'Not Found!';
    ctx.status = 404;
  }
};

app.use(main);

app.listen(port);