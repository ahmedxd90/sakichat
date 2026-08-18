"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import * as crypto from "crypto";

// Generate ZEGOCLOUD Token04 using the official format.
// The Server Secret is the raw 32-byte key and must remain server-side.
// Layout after the `04` prefix: expireTime (8-byte BE) + ivLength (2-byte BE)
// + iv + encryptedLength (2-byte BE) + AES-256-CBC encrypted JSON.
function generateToken04(
  appId: number,
  userId: string,
  secret: string,
  effectiveTimeInSeconds: number,
  payload: string = ""
): string {
  if (!Number.isInteger(appId) || appId <= 0) throw new Error("Invalid ZEGOCLOUD App ID");
  if (!userId || typeof userId !== "string") throw new Error("Invalid ZEGOCLOUD user ID");
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") !== 32) {
    throw new Error("ZEGOCLOUD Server Secret must be a 32-byte string");
  }

  const createTime = Math.floor(Date.now() / 1000);
  const expireTime = createTime + effectiveTimeInSeconds;
  const nonce = crypto.randomInt(-2147483648, 2147483647);
  const tokenBody = JSON.stringify({
    app_id: appId,
    user_id: userId,
    nonce,
    ctime: createTime,
    expire: expireTime,
    payload: payload || "",
  });

  const ivChars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let iv = "";
  for (let i = 0; i < 16; i++) iv += ivChars[Math.floor(Math.random() * ivChars.length)];
  const ivBuffer = Buffer.from(iv, "utf8");
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(secret, "utf8"), ivBuffer);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(tokenBody, "utf8")), cipher.final()]);

  const expireBuffer = Buffer.alloc(8);
  expireBuffer.writeBigInt64BE(BigInt(expireTime), 0);
  const ivLengthBuffer = Buffer.alloc(2);
  ivLengthBuffer.writeUInt16BE(ivBuffer.length, 0);
  const encryptedLengthBuffer = Buffer.alloc(2);
  encryptedLengthBuffer.writeUInt16BE(encrypted.length, 0);

  return `04${Buffer.concat([expireBuffer, ivLengthBuffer, ivBuffer, encryptedLengthBuffer, encrypted]).toString("base64")}`;
}

export const generateToken = action({
  args: {
    roomId: v.string(),
    userId: v.string(),
  },
  handler: async (_ctx, args) => {
    const appId = parseInt(process.env.ZEGO_APP_ID || "0", 10);
    const serverSecret = process.env.ZEGO_SERVER_SECRET || "";

    if (!appId || !serverSecret) {
      throw new Error("ZEGOCLOUD credentials not configured: ZEGO_APP_ID or ZEGO_SERVER_SECRET missing");
    }

    console.log("Generating ZEGO token for appId:", appId, "userId:", args.userId);
    const payload = JSON.stringify({
      room_id: args.roomId,
      privilege: { 1: 1, 2: 1 },
      stream_id_list: null,
    });
    const token = generateToken04(appId, args.userId, serverSecret, 3600, payload);
    console.log("Token generated, prefix:", token.substring(0, 10), "length:", token.length);
    return token;
  },
});
