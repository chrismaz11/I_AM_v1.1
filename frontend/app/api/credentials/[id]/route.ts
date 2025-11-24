import { AuditAction, CredentialStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(CredentialStatus).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credential = await prisma.credential.findUnique({
    where: { id: params.id },
    include: { files: true, verifications: true, shares: true, issuer: true },
  });

  if (!credential || credential.subjectId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: credential });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.credential.findUnique({ where: { id: params.id } });
  if (!existing || existing.subjectId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = await prisma.credential.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : existing.expiresAt,
      auditLogs: {
        create: {
          actorId: session.user.id,
          action: AuditAction.UPDATE_CREDENTIAL,
          targetType: "credential",
          targetId: params.id,
        },
      },
    },
    include: { files: true, verifications: true, shares: true },
  });

  return NextResponse.json({ data: updated });
}
