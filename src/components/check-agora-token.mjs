import pkg from "agora-token";
const { RtcTokenBuilder, RtcRole } = pkg;

const appId = process.env.CHECK_AGORA_APP_ID;
const certificate = process.env.CHECK_AGORA_CERTIFICATE;
const channel = "rcheck-audio";
const uid = 123456;
const expiresAt = Math.floor(Date.now() / 1000) + 3600;

if (!appId || !certificate) throw new Error("Missing Agora check values");
const token = RtcTokenBuilder.buildTokenWithUid(
  appId,
  certificate,
  channel,
  uid,
  RtcRole.PUBLISHER,
  expiresAt,
  expiresAt,
);

console.log(JSON.stringify({
  appIdLength: appId.length,
  certificateLength: certificate.length,
  tokenVersion: token.slice(0, 3),
  tokenLength: token.length,
  tokenGenerated: token.length > 20,
}));
