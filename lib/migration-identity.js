import { createHash } from "node:crypto";

const BATCH_ONE_NAMESPACE = "8e8f43b4-7877-4c68-96d8-58135208a811";

function uuidBytes(uuid) {
  return Buffer.from(uuid.replaceAll("-", ""), "hex");
}

export function stableMigrationDocumentId(sourcePath, sourceSha256) {
  const digest = createHash("sha1")
    .update(uuidBytes(BATCH_ONE_NAMESPACE))
    .update(`${sourcePath}\0${sourceSha256}`)
    .digest()
    .subarray(0, 16);
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
