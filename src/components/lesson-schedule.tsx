import { CalendarDays, ExternalLink, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LessonRegister } from "@/lib/lesson-register";

export function LessonSchedule({ entries, heading = "Lesson register" }: { entries: LessonRegister[]; heading?: string }) {
  return <section className="grid gap-4" aria-label={heading}>
    <div><h2 className="text-xl font-bold text-primary">{heading}</h2><p className="mt-1 text-sm text-muted-foreground">Your lesson plans, class links, and completed lesson marks.</p></div>
    {entries.length ? <div className="grid gap-4">
      {entries.map((entry) => <article key={entry.id} className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-primary" /><span>Starts {entry.startDate}</span></div>
          {entry.meetingUrl && <Button asChild size="sm"><a href={entry.meetingUrl} target="_blank" rel="noreferrer"><Video />Join virtual class<ExternalLink /></a></Button>}
        </div>
        <ol className="divide-y divide-border">
          {entry.lessons.map((lesson, index) => <li key={lesson.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div><p className="font-semibold">Lesson {index + 1}: {lesson.title}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{lesson.plan}</p></div>
            <p className="text-sm font-semibold text-foreground">{entry.marks[lesson.id] === undefined ? <span className="text-muted-foreground">Not marked yet</span> : `Mark: ${entry.marks[lesson.id]} / 100`}</p>
          </li>)}
        </ol>
      </article>)}
    </div> : <p className="border-y py-8 text-sm text-muted-foreground">No lesson register has been shared with you yet.</p>}
  </section>;
}