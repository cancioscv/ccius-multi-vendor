import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { errorMiddleware } from "@e-com/libs";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to admin-service!" });
});

app.use(errorMiddleware);

const port = process.env.PORT || 6005;
app.listen(port, () => {
  console.log(`Admin Service is running on http://localhost:${port}/api`);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});
