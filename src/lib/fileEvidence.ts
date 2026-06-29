import type { EvidenceItem, EvidenceOwner, EvidenceStatus } from "./projectModel";

export type LocalFileEvidenceOptions = {
  owner?: EvidenceOwner;
  status?: EvidenceStatus;
};

export async function hashLocalFile(file: File): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await readFileBytes(file));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createEvidenceItemFromFile(
  file: File,
  options: LocalFileEvidenceOptions = {}
): Promise<EvidenceItem> {
  const fileHash = await hashLocalFile(file);
  const mimeType = file.type || "unknown";
  const lastModified = new Date(file.lastModified).toISOString();

  return {
    label: file.name,
    kind: "Local file metadata",
    source: `local file: ${file.name}`,
    status: options.status ?? "received",
    owner: options.owner ?? "Founder",
    content: [
      "Local file evidence metadata. Raw file bytes are not stored in LexProof.",
      `File name: ${file.name}`,
      `MIME type: ${mimeType}`,
      `Size bytes: ${file.size}`,
      `Last modified: ${lastModified}`,
      `File SHA-256: ${fileHash}`
    ].join("\n")
  };
}

function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to read local file bytes."));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read local file bytes.")));
    reader.readAsArrayBuffer(file);
  });
}
