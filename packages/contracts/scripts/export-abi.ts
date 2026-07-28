import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const workspace = process.cwd();
  const artifactPath = path.join(
    workspace,
    "artifacts",
    "contracts",
    "AccordPayEscrow.sol",
    "AccordPayEscrow.json",
  );
  const outputDirectory = path.resolve(workspace, "../shared/src/contracts");
  const outputPath = path.join(outputDirectory, "accordpay-escrow-abi.json");
  const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as {
    abi: unknown[];
  };

  if (!Array.isArray(artifact.abi)) {
    throw new Error("AccordPayEscrow artifact does not contain a valid ABI");
  }

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(artifact.abi, null, 2)}\n`,
    "utf8",
  );
  console.log(`Exported ABI only: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
