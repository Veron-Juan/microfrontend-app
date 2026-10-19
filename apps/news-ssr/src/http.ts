// Utilidades de Express que no son de esta app en particular.
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Express 4 no atrapa promesas rechazadas: esto pasa el error a `next` para que llegue al manejador. */
export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export const notFound: RequestHandler = (req, res) => {
  res.status(404).type("text").send(`no existe: ${req.path}`);
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  // Si ya se empezó a responder, solo Express puede cortar la conexión.
  if (res.headersSent) {
    next(error);
    return;
  }
  console.error(`news-ssr: error en ${req.method} ${req.path}`, error);
  res.status(500).type("text").send("error al renderizar el fragmento");
};
