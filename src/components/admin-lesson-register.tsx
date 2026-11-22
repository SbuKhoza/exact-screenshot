import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, Loader2, Plus, Save, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTenant } from "@/lib/tenant-context";
import { friendlyError } from "@/lib/firebase";
import { createAdminLessonRegister, listAdminLessonRegisters, listAdminRegisterEntries, setLessonCompletionMark } from "@/lib/lesson-register-data";
import { lessonRegisterSchema, type PlannedLesson } from "@/lib/lesson-register";
import type { Learner } from "@/lib/services";

const newLesson = (index: number): PlannedLesson => ({ id: `lesson-${index}`, title: "", plan: "" });

export function AdminLessonRegister({ learners, adminUid }: { learners: Learner[]; adminUid: string }) {
  const { tenantId } = useTenant();
  const client = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [lessonList, setLessonList] = useState<PlannedLesson[]>([newLesson(1)]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [busyMark, setBusyMark] = useState("");
  const [markNotice, setMarkNotice] = useState("");

  const eligible = useMemo(() => learners.filter((learner) => learner.registrationStatus === "enrolled"
    && (Boolean(learner.uid) || Boolean(learner.parentUid))), [learners]);
  const registers = useQuery({
    queryKey: ["admin-lesson-registers", tenantId],
    queryFn: () => tenantId ? listAdminLessonRegisters(tenantId) : [],
    enabled: Boolean(tenantId), retry: false,
  });
  const activeGroup = registers.data?.find((register) => register.id === activeId) ?? null;
  const entries = useQuery({
    queryKey: ["admin-lesson-register-entries", tenantId, activeId],
    queryFn: () => tenantId && activeId ? listAdminRegisterEntries(tenantId, activeId) : [],
    enabled: Boolean(tenantId && activeId), retry: false,
  });

  function toggleLearner(id: string) {
    setSelected((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
    setSaved(false);
  }
  function editLesson(index: number, key: "title" | "plan", value: string) {
    setLessonList((current) => current.map((lesson, item) => item === index ? { ...lesson, [key]: value } : lesson));
    setSaved(false);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId) return;
    setError(""); setSaved(false);
    const result = lessonRegisterSchema.safeParse({ startDate, meetingUrl, learnerIds: selected, lessons: lessonList });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Check the register details."); return; }
    setSaving(true);
    try {
      const groupId = await createAdminLessonRegister(tenantId, adminUid, eligible, result.data);
      setStartDate(""); setMeetingUrl(""); setLessonList([newLesson(1)]); setSelected([]); setSaved(true); setActiveId(groupId);
      await client.invalidateQueries({ queryKey: ["admin-lesson-registers", tenantId] });
      await client.invalidateQueries({ queryKey: ["admin-lesson-register-entries", tenantId, groupId] });
    } catch (reason) { setError(friendlyError(reason)); } finally { setSaving(false); }
  }
  async function saveMark(entryId: string, lessonId: string, lessonTitle: string) {
    const entry = entries.data?.find((item) => item.id === entryId);
    if (!entry) return;
    const rawMark = marks[`${entryId}:${lessonId}`] ?? (entry.marks[lessonId] === undefined ? "" : String(entry.marks[lessonId]));
    if (!rawMark.trim()) { setError("Enter a mark from 0 to 100."); return; }
    const score = Number(rawMark);
    setBusyMark(`${entryId}:${lessonId}`); setMarkNotice(""); setError("");
    try {
      await setLessonCompletionMark(entry, lessonId, score);
      await client.invalidateQueries({ queryKey: ["admin-lesson-register-entries", tenantId, activeId] });
      setMarkNotice(`${entry.learnerName}: ${lessonTitle} marked complete.`);
    } catch (reason) {
      const localError = reason instanceof Error && (reason.message.startsWith("Enter a mark") || reason.message.startsWith("This lesson"));
      setError(localError && reason instanceof Error ? reason.message : friendlyError(reason));
    } finally { setBusyMark(""); }
  }

  return <div className="grid gap-8">
    <div>
      <h2 className="text-xl font-bold">New lesson register</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose enrolled learners and share the plans and class link with those accounts.</p>
    </div>
    <form onSubmit={(event) => void submit(event)} noValidate className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">Start date
          <Input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setSaved(false); }} required />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">Virtual class link <span className="font-normal text-muted-foreground">(optional)</span>
          <Input type="url" inputMode="url" maxLength={500} placeholder="https://…" value={meetingUrl} onChange={(event) => { setMeetingUrl(event.target.value); setSaved(false); }} />
        </label>
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-semibold">Learners to include</legend>
        {eligible.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {eligible.map((learner) => <label key={learner.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card p-3 text-sm">
            <Checkbox checked={selected.includes(learner.id)} onCheckedChange={() => toggleLearner(learner.id)} />
            <span className="min-w-0"><span className="block truncate font-semibold">{learner.firstName} {learner.surname}</span><span className="text-muted-foreground">{learner.grade} · {learner.schoolName}</span></span>
          </label>)}
        </div> : <p className="border-y py-5 text-sm text-muted-foreground">No enrolled learners with linked accounts are available yet.</p>}
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-1 font-semibold">Lesson plan</legend>
        {lessonList.map((lesson, index) => <div key={lesson.id} className="grid gap-3 border-t border-border py-4 sm:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.4fr)]">
          <label className="grid gap-1.5 text-sm font-semibold">Lesson {index + 1} title
            <Input maxLength={100} placeholder="For example, linear equations" value={lesson.title} onChange={(event) => editLesson(index, "title", event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Topics and activities
            <Textarea maxLength={1000} rows={2} placeholder="What will be covered in this lesson?" value={lesson.plan} onChange={(event) => editLesson(index, "plan", event.target.value)} />
          </label>
        </div>)}
        <Button type="button" variant="outline" className="justify-self-start" disabled={lessonList.length >= 12} onClick={() => setLessonList((current) => [...current, newLesson(current.length + 1)])}><Plus />Add a lesson</Button>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="text-sm text-success">Register shared with the selected learners.</p>}
      <Button type="submit" disabled={saving} className="justify-self-start">{saving ? <Loader2 className="animate-spin" /> : <Save />}Save register</Button>
    </form>

    <section className="grid gap-4 border-t border-border pt-7">
      <div><h2 className="text-xl font-bold">Saved registers</h2><p className="mt-1 text-sm text-muted-foreground">Open a register to record a mark for each learner after a lesson.</p></div>
      {registers.isPending ? <Loader2 className="animate-spin text-primary" /> : registers.error ? <p role="alert" className="text-sm text-destructive">{friendlyError(registers.error)}</p> : registers.data?.length ? <div className="grid gap-2 sm:grid-cols-2">
        {registers.data.map((register) => <Button key={register.id} type="button" variant="outline" aria-pressed={activeId === register.id} className={`h-auto justify-start whitespace-normal p-4 text-left ${activeId === register.id ? "border-primary bg-accent" : ""}`} onClick={() => { setActiveId(register.id); setMarkNotice(""); }}>
          <CalendarDays className="shrink-0" /><span className="min-w-0"><span className="block">Starts {register.startDate}</span><span className="block text-xs font-normal text-muted-foreground">{register.lessons.length} lessons · {register.learnerIds.length} learners</span></span>
        </Button>)}
      </div> : <p className="border-y py-6 text-sm text-muted-foreground">No registers have been created yet.</p>}
      {activeGroup && <div className="grid gap-5 border-y border-border py-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">Register starting {activeGroup.startDate}</h3><p className="text-sm text-muted-foreground">{activeGroup.lessons.length} planned lessons</p></div>{activeGroup.meetingUrl && <Button asChild size="sm" variant="outline"><a href={activeGroup.meetingUrl} target="_blank" rel="noreferrer"><Video />Open meeting link</a></Button>}</div>
        {markNotice && <p role="status" className="text-sm text-success">{markNotice}</p>}
        {entries.isPending ? <Loader2 className="animate-spin text-primary" /> : entries.error ? <p role="alert" className="text-sm text-destructive">{friendlyError(entries.error)}</p> : entries.data?.map((entry) => <article key={entry.id} className="grid gap-3 border-t border-border pt-4">
          <h4 className="font-semibold">{entry.learnerName}</h4>
          {entry.lessons.map((lesson, index) => <div key={lesson.id} className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
            <p className="text-sm"><ClipboardList className="mr-2 inline h-4 w-4 text-primary" />Lesson {index + 1}: {lesson.title} <span className="text-muted-foreground">{entry.marks[lesson.id] === undefined ? "· Not marked" : `· Mark ${entry.marks[lesson.id]} / 100`}</span></p>
            <Input aria-label={`Mark for ${entry.learnerName}, ${lesson.title}`} type="number" min={0} max={100} step={1} placeholder="0–100" value={marks[`${entry.id}:${lesson.id}`] ?? (entry.marks[lesson.id] === undefined ? "" : String(entry.marks[lesson.id]))} onChange={(event) => setMarks((current) => ({ ...current, [`${entry.id}:${lesson.id}`]: event.target.value }))} />
            <Button type="button" size="sm" variant="outline" disabled={busyMark === `${entry.id}:${lesson.id}`} onClick={() => void saveMark(entry.id, lesson.id, lesson.title)}>{busyMark === `${entry.id}:${lesson.id}` ? <Loader2 className="animate-spin" /> : <Save />}Save mark</Button>
          </div>)}
        </article>)}
      </div>}
    </section>
  </div>;
}