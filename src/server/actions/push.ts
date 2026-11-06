"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { runAction } from "@/server/actions/run";
import type { ActionResult } from "@/types/dto";

const subscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(300),
    auth: z.string().min(1).max(100),
  }),
});

const endpointSchema = z.object({ endpoint: z.url().max(1000) });

/** Register (or re-own) this device for habit-start pushes. */
export async function savePushSubscription(input: unknown): Promise<ActionResult> {
  return runAction({ name: "savePushSubscription", bucket: "write", schema: subscriptionSchema }, input, async (data, user) => {
    await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: { userId: user.id, endpoint: data.endpoint, p256dh: data.keys.p256dh, auth: data.keys.auth },
      update: { userId: user.id, p256dh: data.keys.p256dh, auth: data.keys.auth },
    });
    return undefined;
  });
}

export async function removePushSubscription(input: unknown): Promise<ActionResult> {
  return runAction({ name: "removePushSubscription", bucket: "write", schema: endpointSchema }, input, async (data, user) => {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: data.endpoint, userId: user.id } });
    return undefined;
  });
}
