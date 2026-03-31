import express from "express";
import cors from "cors";
import checkinRoutes from "./routes/checkin";
import guestRoutes from "./routes/guests";
import statsRoutes from "./routes/stats";
import { AppError } from "./lib/errors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/checkin", checkinRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/stats", statsRoutes);

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: err.message,
        ...(err instanceof AppError && "details" in err
          ? { details: (err as any).details }
          : {}),
      });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
