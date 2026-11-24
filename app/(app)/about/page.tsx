import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getMeCached } from "@/lib/session";

export const metadata: Metadata = {
  title: "About",
  description: "Why this family recipe book exists.",
};

export default async function AboutPage() {
  const session = await getMeCached();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="About" hand="why this book exists" />
      <div className="card space-y-3.5 text-[15.5px] font-semibold leading-relaxed text-ink">
        <p>
          Everyone in my family bakes. Mom is the reason, and she&apos;s the best baker we know. Cut any of us open and
          you&apos;d probably find flour and sugar inside.
        </p>
        <p>
          Somewhere along the way, baking became a group project. Someone tries a new cookie, someone else tweaks it,
          and the recipe gets passed around as a screenshot, a voice note or a half-remembered message. Most of it
          ended up buried in our chats, and a few good ones were lost for good.
        </p>
        <p>
          So I made this: one place where our recipes live, where we log what we baked and how it turned out, and where
          the next tweak doesn&apos;t start from scratch.
        </p>
        <p>Some of it is shared publicly, so if you&apos;ve landed here, you&apos;re welcome to look around and bake along.</p>
        <p>
          If you try something and want to say hi, or swap a recipe, find me on Instagram:{" "}
          <a
            href="https://instagram.com/deatann"
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-peach-500 underline"
          >
            @deatann
          </a>
        </p>
      </div>
      {!session && (
        <div className="mt-5 text-center">
          <Link href="/login?next=/recipes" className="btn bg-butter-300">
            Family sign in
          </Link>
        </div>
      )}
    </div>
  );
}
