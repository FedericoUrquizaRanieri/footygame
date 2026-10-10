/** Los navegadores piden /favicon.ico por costumbre: se redirige al ícono SVG de la app. */
export function GET(request: Request): Response {
  return Response.redirect(new URL("/icon.svg", request.url), 308);
}
