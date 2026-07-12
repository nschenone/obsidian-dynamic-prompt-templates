import { runCli } from "./core";

const exitCode = await runCli(
  process.argv.slice(2),
  {
    stdout: (message) => {
      if (message.length > 0) {
        process.stdout.write(`${message}\n`);
      }
    },
    stderr: (message) => {
      if (message.length > 0) {
        process.stderr.write(`${message}\n`);
      }
    }
  },
  fetch
).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  return 1;
});

process.exit(exitCode);
