import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
// import swaggerUi from "swagger-ui-express";
// import axios from "axios";
import cookirParser from "cookie-parser";
import initializeSiteConfig from "./libs/initializeSiteConfig.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookirParser());

app.set("trus proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user ? 1000 : 100),
  message: { error: "Too many requests frm this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: true,
  // keyGenerator: (req: any) => req.ip, // The keyGenerator is implicit and uses req.ip by default
});

app.use(apiLimiter);
app.get("/gateway-health", (req, res) => {
  res.send({ message: "Welcome to api-gateway!" });
});

app.use("/product", proxy("http://localhost:6002"));
app.use("/", proxy("http://localhost:6001"));

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Api Gateway running at http://localhost:${port}/api`);
  try {
    initializeSiteConfig();
    console.log("Site config initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to initialize site config", error);
  }
});
server.on("error", console.error);
