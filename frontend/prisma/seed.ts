import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import {
  AuditAction,
  CredentialStatus,
  FileCategory,
  PrismaClient,
  SubscriptionTier,
  VerificationStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const hashPayload = (payload: Record<string, unknown>) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");

const upsertRole = (name: string, description: string) =>
  prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });

const upsertPlan = (
  name: string,
  tier: SubscriptionTier,
  priceMonthly: number,
  features: string[],
  credentialLimit?: number,
) =>
  prisma.subscriptionPlan.upsert({
    where: { name },
    update: { tier, priceMonthly, features, credentialLimit },
    create: { name, tier, priceMonthly, features, credentialLimit },
  });

async function main() {
  const [adminRole, memberRole, verifierRole] = await Promise.all([
    upsertRole("admin", "Platform admin"),
    upsertRole("member", "Individual wallet holder"),
    upsertRole("verifier", "Institution reviewer"),
  ]);

  const [freePlan, proPlan] = await Promise.all([
    upsertPlan("Free", SubscriptionTier.FREE, 0, ["1 institution link", "5 credentials"], 5),
    upsertPlan("Pro", SubscriptionTier.PRO, 29, ["Custom branding", "Unlimited credentials", "Audit log export"]),
  ]);

  const institution = await prisma.institution.upsert({
    where: { name: "I AM Verifications" },
    update: {},
    create: {
      name: "I AM Verifications",
      domain: "iam.demo",
      contactEmail: "verifications@iam.demo",
    },
  });

  const [admin, verifier, member] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@iam.demo" },
      update: {},
      create: {
        email: "admin@iam.demo",
        passwordHash: await bcrypt.hash("admin123", 10),
        name: "Admin User",
        roleId: adminRole.id,
        subscriptionPlanId: proPlan.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "verifier@iam.demo" },
      update: {},
      create: {
        email: "verifier@iam.demo",
        passwordHash: await bcrypt.hash("verify123", 10),
        name: "Verifier One",
        roleId: verifierRole.id,
        institutionId: institution.id,
        subscriptionPlanId: proPlan.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "user@iam.demo" },
      update: {},
      create: {
        email: "user@iam.demo",
        passwordHash: await bcrypt.hash("user123", 10),
        name: "Avery Lee",
        roleId: memberRole.id,
        subscriptionPlanId: freePlan.id,
        identityDid: "did:key:zDemoUserDid",
        identityPublicKey: "demo-public-key",
        identityEncryptedPrivateKey: "encrypted-private-key-placeholder",
      },
    }),
  ]);

  const credentialPayload = {
    issuer: institution.name,
    subject: member.name ?? "Avery Lee",
    type: "Forklift Certification",
    credentialNumber: "CERT-2048",
    issuedAt: new Date().toISOString(),
    competencies: ["OSHA compliance", "Heavy equipment"],
  };

  const existingCredential = await prisma.credential.findFirst({
    where: { hash: hashPayload(credentialPayload) },
  });

  const credential =
    existingCredential ??
    (await prisma.credential.create({
      data: {
        title: "Forklift Certification",
        description: "Verified heavy machinery certification",
        subjectId: member.id,
        issuerId: institution.id,
        status: CredentialStatus.VERIFIED,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        payload: credentialPayload,
        hash: hashPayload(credentialPayload),
      },
    }));

  const fileKey = "uploads/demo-forklift.pdf";
  const existingFile = await prisma.file.findFirst({ where: { key: fileKey } });
  if (!existingFile) {
    await prisma.file.create({
      data: {
        key: fileKey,
        url: `https://example-bucket.s3.amazonaws.com/${fileKey}`,
        type: FileCategory.DOCUMENT,
        size: 42_000,
        credentialId: credential.id,
        uploadedById: member.id,
      },
    });
  }

  const verification = await prisma.verification.upsert({
    where: { id: credential.id },
    update: {
      status: VerificationStatus.APPROVED,
      note: "Validated by I AM Verifications",
      reviewerId: verifier.id,
    },
    create: {
      id: credential.id, // deterministic for idempotency
      credentialId: credential.id,
      institutionId: institution.id,
      reviewerId: verifier.id,
      status: VerificationStatus.APPROVED,
      note: "Validated by I AM Verifications",
    },
  });

  await prisma.credential.update({
    where: { id: credential.id },
    data: { status: CredentialStatus.VERIFIED },
  });

  const shareToken = randomBytes(24).toString("base64url");
  const shareExists = await prisma.credentialShare.findFirst({
    where: { credentialId: credential.id },
  });
  if (!shareExists) {
    await prisma.credentialShare.create({
      data: {
        credentialId: credential.id,
        token: shareToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });
  }

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: AuditAction.USER_REGISTER,
        targetType: "user",
        targetId: admin.id,
        meta: { email: admin.email },
      },
      {
        actorId: member.id,
        action: AuditAction.CREATE_CREDENTIAL,
        targetType: "credential",
        targetId: credential.id,
        meta: { title: credential.title },
      },
      {
        actorId: verifier.id,
        action: AuditAction.VERIFICATION_REVIEW,
        targetType: "verification",
        targetId: verification.id,
        meta: { status: verification.status },
      },
      {
        actorId: member.id,
        action: AuditAction.SHARE_CREATED,
        targetType: "share",
        targetId: credential.id,
        meta: { tokenPreview: `${shareToken.slice(0, 6)}...` },
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed data ready: demo accounts and credential loaded.");
}

main()
  .catch((err) => {
    console.error("Seed error", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
