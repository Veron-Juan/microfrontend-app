// Express utilities that aren't specific to this app.
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Express 4 doesn't catch rejected promises: this passes the error to `next` so it reaches the handler. */
export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export const notFound: RequestHandler = (req, res) => {
  res.status(404).type("text").send(`not found: ${req.path}`);
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  // If the response has already started, only Express can cut the connection.
  if (res.headersSent) {
    next(error);
    return;
  }
  console.error(`news-ssr: error on ${req.method} ${req.path}`, error);
  res.status(500).type("text").send("error rendering the fragment");
};
