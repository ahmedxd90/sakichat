"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { RtcTokenBuilder, RtcRole } from "agora-token";

/** Public identifier needed by the Agora client; never expose the certificate here. */
export const getAppId = action({
  args: {},
  handler: async () => process.env.AGORA_APP_ID ?? "",
});

export const generateToken = action({
  args: {
    channelName: v.string(),
    uid: v.number(),
  },
  handler: async (_ctx, args) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      // If no certificate configured, return null (testing mode)
      return null;
    }

    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      args.channelName,
      args.uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return token;
  },
});
