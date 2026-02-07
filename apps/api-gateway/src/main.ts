import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
// import swaggerUi from "swagger-ui-express";
// import axios from "axios";
import cookieParser from "cookie-parser";
import initializeSiteConfig from "./libs/initializeSiteConfig.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

app.set("trus proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user ? 1000 : 100),
  message: { error: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: true,
  // keyGenerator: (req: any) => req.ip, // The keyGenerator is implicit and uses req.ip by default
});

app.use(apiLimiter);

app.get("/gateway-health", (req, res) => {
  res.send({ message: "Welcome to api-gateway!" });
});

app.use("/product", proxy("http://localhost:6002"));
app.use("/seller", proxy("http://localhost:6004"));
app.use("/order", proxy("http://localhost:6003"));
app.use("/admin", proxy("http://localhost:6005"));
app.use("/chatting", proxy("http://localhost:6006"));
app.use("/", proxy("http://localhost:6001"));

const port = process.env.PORT || 8082;
const server = app.listen(port, () => {
  console.log(`Api Gateway running at http://localhost:${port}/api`);
  try {
    initializeSiteConfig();
    console.log("Site Config initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize site config", error);
  }
});
server.on("error", console.error);
