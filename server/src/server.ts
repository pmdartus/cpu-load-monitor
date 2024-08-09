import { createApp } from "./app.js";

const PORT = parseInt(process.env.PORT ?? "3000");

const app = createApp();

async function gracefullyStop() {
  app.log.info("Gracefully stopping the server...");
  await app.close();
}

try {
  await app.listen({ port: PORT });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

process.on("SIGTERM", gracefullyStop);
process.on("SIGINT", gracefullyStop);
