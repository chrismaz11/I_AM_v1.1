import { AuditAction } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  const memberRole = await prisma.role.findFirst({ where: { name: "member" } });
  const freePlan = await prisma.subscriptionPlan.findFirst({ where: { tier: "FREE" } });

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: hashed,
      roleId: memberRole?.id,
      subscriptionPlanId: freePlan?.id,
    },
    select: { id: true, email: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: AuditAction.USER_REGISTER,
      targetType: "user",
      targetId: user.id,
      meta: { email: user.email },
    },
  });

  return NextResponse.json({ success: true, userId: user.id });
}
