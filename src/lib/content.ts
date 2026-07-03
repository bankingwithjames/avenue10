import { prisma } from "@/lib/prisma";

export async function getSiteContent(): Promise<Record<string, string>> {
  const items = await prisma.siteContent.findMany();
  return Object.fromEntries(items.map((item: { key: string; value: string }) => [item.key, item.value]));
}

export async function getPageMedia(): Promise<Record<string, string>> {
  const items = await prisma.pageMedia.findMany({
    include: { media: { select: { url: true } } },
  });
  return Object.fromEntries(
    items.map((item: { location: string; media: { url: string } }) => [item.location, item.media.url])
  );
}
