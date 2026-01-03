import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@e-com/libs";
// import swaggerUi from 'swagger-ui-express';
// import swaggerDocument from './swagger/swagger-output.json' with { type: 'json' };

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
  res.send({ message: "Hello Product ServiceAPI" });
});

// Swagger docs
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.get('/docs-json', (req, res) => {
//   res.json(swaggerDocument);
//   // res.status(200).json(swaggerDocument);
// });

// Routes
// app.use('/api', authRouter);

app.use(errorMiddleware);

const port = process.env.PORT || 6002;
app.listen(port, () => {
  console.log(`Product Service is running on http://localhost:${port}/api`);
  // console.log(`Swagger Docs are available at http://localhost:${port}/docs`);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

// server.on("error", (err) => {
//   console.log("Server Error:", err);
// });
