import { AuditAction, CredentialStatus, FileCategory, VerificationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hashPayload } from "@/lib/crypto";
import prisma from "@/lib/prisma";
import { createCredentialSchema } from "@/lib/validators/credentials";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = await prisma.credential.findMany({
    where: { subjectId: session.user.id },
    include: {
      files: true,
      verifications: true,
      shares: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: credentials });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCredentialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const institution = session.user.institutionId
    ? await prisma.institution.findUnique({ where: { id: session.user.institutionId } })
    : await prisma.institution.findFirst();

  const hash = hashPayload(parsed.data.payload);

  const credential = await prisma.credential.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      payload: parsed.data.payload,
      hash,
      status: CredentialStatus.PENDING,
      subjectId: session.user.id,
      issuerId: institution?.id,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      files: parsed.data.file
        ? {
            create: {
              key: parsed.data.file.name,
              url:
                parsed.data.file.url ??
                `https://example-bucket.s3.amazonaws.com/uploads/${parsed.data.file.name}`,
              type: FileCategory.DOCUMENT,
              size: parsed.data.file.size,
              uploadedById: session.user.id,
            },
          }
        : undefined,
      verifications: institution
        ? {
            create: {
              institutionId: institution.id,
              status: VerificationStatus.PENDING,
              note: "Awaiting reviewer",
            },
          }
        : undefined,
      auditLogs: {
        create: {
          actorId: session.user.id,
          action: AuditAction.CREATE_CREDENTIAL,
          targetType: "credential",
        },
      },
    },
    include: { files: true, verifications: true },
  });

  return NextResponse.json({ data: credential });
}
