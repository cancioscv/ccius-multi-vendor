import express, { NextFunction, Response, Request } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@e-com/libs";
import sellerRouter from "./routes/seller.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to seller-service!" });
});

// Routes
app.use("/api", sellerRouter);

app.use(errorMiddleware);

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Seller Service running on http://localhost:${port}/api`);
});
server.on("error", console.error);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});
