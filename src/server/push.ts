import "server-only";
import webpush from "web-push";
import { prisma } from "@/server/db";

/**
 * Web Push ("habit starts now" on every registered device).
 * Needs VAPID_PRIVATE_KEY plus NEXT_PUBLIC_VAPID_PUBLIC_KEY; without them
 * push is simply off and every send is skipped.
 */

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

export const pushConfigured = Boolean(publicKey && privateKey);
if (pushConfigured) {
  webpush.setVapidDetails("mailto:devnetraconsultancy@gmail.com", publicKey!, privateKey!);
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/** Send to every device of a user; dead subscriptions (404/410) are removed. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!pushConfigured) return 0;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let delivered = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 1800, urgency: "high" }
        );
        delivered += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
        } else {
          console.error("[push] send failed", { endpoint: sub.endpoint.slice(0, 40), status });
        }
      }
    })
  );
  return delivered;
}
