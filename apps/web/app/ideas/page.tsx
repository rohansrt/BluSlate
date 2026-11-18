import type { Metadata } from "next";
import { NotebookPen, Sparkles, Trash2 } from "lucide-react";
import { Button, Card } from "@bluslate/ui";
import { AccountPageHeader } from "@/components/account/page-header";
import { IdeaForm, SaveSuggestionButton, StartFromIdeaButton } from "@/components/account/forms";
import { deleteIdea } from "@/lib/account-actions";
import { prisma } from "@/lib/db";
import { IDEA_SUGGESTIONS } from "@/lib/idea-suggestions";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = { title: "Idea Book", robots: { index: false, follow: false } };

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Idea Book (docs/decisions/0011): memos saved to the account, and ideas to pick from. */
export default async function IdeasPage() {
  const user = await requireUser("/ideas");
  const notes = await prisma.ideaNote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const saved = new Set(notes.map((n) => n.text));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <AccountPageHeader
        icon={NotebookPen}
        title="Idea Book"
        lead="Jot ideas down as they come. Start a startup from any of them when you're ready."
      />

      <Card className="mt-8 p-6">
        <IdeaForm />
      </Card>

      <section aria-labelledby="my-ideas" className="mt-10">
        <h2 id="my-ideas" className="text-xl font-semibold">
          Your ideas{" "}
          {notes.length > 0 && <span className="text-muted-foreground">({notes.length})</span>}
        </h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            Nothing here yet. Write one above, or pick one below.
          </p>
        ) : (
          <ul className="mt-4 space-y-3" data-testid="idea-list">
            {notes.map((n) => (
              <li key={n.id}>
                <Card className="p-4">
                  <p className="whitespace-pre-wrap">{n.text}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {dateFormat.format(n.createdAt)}
                      {n.source === "suggested" && " · picked from suggestions"}
                    </p>
                    <div className="flex items-center gap-1">
                      <StartFromIdeaButton text={n.text} name={user.name ?? null} />
                      <form action={deleteIdea}>
                        <input type="hidden" name="id" value={n.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          aria-label="Delete this idea"
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </form>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pick-ideas" className="mt-12">
        <h2 id="pick-ideas" className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="size-5 text-primary" aria-hidden /> Ideas to pick from
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Starting points, not recommendations: the seven steps will tell you if one holds up.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {IDEA_SUGGESTIONS.map((idea) => (
            <li key={idea}>
              <Card className="flex h-full flex-col justify-between gap-3 p-4">
                <p className="text-sm">{idea}</p>
                <div className="flex items-center gap-1">
                  {saved.has(idea) ? (
                    <span className="text-sm text-muted-foreground">Saved</span>
                  ) : (
                    <SaveSuggestionButton text={idea} />
                  )}
                  <StartFromIdeaButton text={idea} name={user.name ?? null} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
