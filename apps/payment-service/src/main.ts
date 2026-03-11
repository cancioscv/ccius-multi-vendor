import express, { NextFunction, Request, Response } from "express";

import { errorMiddleware } from "@e-com/libs";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api", (req, res) => {
  res.send({ message: "Welcome to payment-service!" });
});

app.use(errorMiddleware);

const port = process.env.PORT || 6009;
app.listen(port, () => {
  console.log(`Payment Service is running on http://localhost:${port}/api`);
});
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});
