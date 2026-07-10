'use client'

import * as React from 'react'
import {
  Film,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  UploadCloud,
  Play,
  ShoppingBag,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/admin/ui'
import { useListNav } from '@/components/admin/useListNav'
import type { MediaAsset } from '@/lib/supabase/types'
import type { Paged, MediaCounts } from '@/lib/supabase/queries'
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  readVideoDuration,
  MAX_VIDEO_SECONDS,
  type CloudinaryUploadResult,
} from '@/lib/cloudinary'
import {
  createMediaAsset,
  deleteMediaAsset,
  toggleMediaFeatured,
  toggleMediaPublished,
  toggleMediaAvailableForRequest,
  updateMediaAsset,
} from '@/app/admin/(protected)/media-actions'

interface UploadTask {
  id: string
  name: string
  kind: 'image' | 'video'
  progress: number
  error?: string
}

// A finished upload awaiting its details (videos only — the admin must name it).
interface Draft {
  draftId: string
  fileName: string
  result: CloudinaryUploadResult
}

function fmtDuration(sec: number | null): string | null {
  if (!sec && sec !== 0) return null
  const s = Math.round(sec)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/** Clean a filename into a friendly starting name, or '' when it's just an id. */
function suggestName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  const letters = (base.match(/[a-zA-Z]/g) ?? []).length
  const digits = (base.match(/\d/g) ?? []).length
  return letters >= 2 && digits <= letters * 2 ? base : ''
}

export function MediaManager({ data, counts }: { data: Paged<MediaAsset>; counts: MediaCounts }) {
  const router = useRouter()
  const [items, setItems] = React.useState<MediaAsset[]>(data.rows)
  const [tasks, setTasks] = React.useState<UploadTask[]>([])
  const [drafts, setDrafts] = React.useState<Draft[]>([])
  const [editing, setEditing] = React.useState<MediaAsset | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<MediaAsset | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Re-sync the grid whenever the server sends a fresh page (navigation) or we
  // ask it to refresh after an upload/delete, so counts and rows stay accurate.
  React.useEffect(() => {
    setItems(data.rows)
  }, [data])

  const patchTask = (id: string, patch: Partial<UploadTask>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const dropTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id))

  async function processFile(file: File, idx: number) {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const taskId = `${file.name}-${file.size}-${idx}-${Math.round(file.lastModified)}`

    if (!isImage && !isVideo) {
      setTasks((p) => [...p, { id: taskId, name: file.name, kind: 'image', progress: 0, error: 'Not an image or video' }])
      return
    }

    const kind: 'image' | 'video' = isVideo ? 'video' : 'image'
    setTasks((p) => [...p, { id: taskId, name: file.name, kind, progress: 0 }])

    // Short-form guard: reject anything 5 minutes or longer, before upload.
    if (isVideo) {
      try {
        const duration = await readVideoDuration(file)
        if (duration >= MAX_VIDEO_SECONDS) {
          patchTask(taskId, { error: 'Video must be under 5 minutes' })
          return
        }
      } catch {
        patchTask(taskId, { error: 'Could not read this video' })
        return
      }
    }

    try {
      const result = await uploadToCloudinary(file, (f) => patchTask(taskId, { progress: f }))
      dropTask(taskId)
      if (isVideo) {
        // Videos need a name + details before they're saved.
        setDrafts((prev) => [...prev, { draftId: taskId, fileName: file.name, result }])
      } else {
        // Photos save immediately (shoppable by default); details editable later.
        const res = await createMediaAsset({
          kind: result.kind,
          url: result.url,
          public_id: result.publicId,
          poster_url: result.posterUrl,
          title: suggestName(file.name) || 'Grill photo',
          duration: result.duration,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        })
        if (!res.ok || !res.asset) {
          setTasks((p) => [...p, { id: taskId, name: file.name, kind, progress: 1, error: res.error || 'Save failed' }])
          return
        }
        setItems((prev) => [res.asset as MediaAsset, ...prev])
        router.refresh() // keep totals + ordering in sync with the server
      }
    } catch (e) {
      setTasks((p) => [...p, { id: taskId, name: file.name, kind, progress: 1, error: e instanceof Error ? e.message : 'Upload failed' }])
    }
  }

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    // Upload every file concurrently so all their progress bars show and advance
    // at once. Each processFile manages its own task row independently.
    const files = Array.from(list)
    files.forEach((file, idx) => {
      void processFile(file, idx)
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const onFeature = (a: MediaAsset) => {
    const next = !a.featured
    setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, featured: next } : it)))
    startTransition(() => toggleMediaFeatured(a.id, next))
  }
  const onPublish = (a: MediaAsset) => {
    const next = !a.is_published
    setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, is_published: next } : it)))
    startTransition(() => toggleMediaPublished(a.id, next))
  }
  const onAvailable = (a: MediaAsset) => {
    const next = !a.available_for_request
    setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, available_for_request: next } : it)))
    startTransition(() => toggleMediaAvailableForRequest(a.id, next))
  }
  // Delete now removes the file from Cloudinary too, so we confirm through a
  // styled dialog (no native window.confirm) before doing anything permanent.
  const performDelete = async () => {
    const a = confirmDelete
    if (!a) return
    setDeleting(true)
    const res = await deleteMediaAsset(a.id)
    setDeleting(false)
    if (res.ok) {
      setItems((prev) => prev.filter((it) => it.id !== a.id))
      setConfirmDelete(null)
      router.refresh() // refresh totals + backfill the page from the server
    }
  }

  const currentDraft = drafts[0] ?? null

  // Save a draft video with its details.
  async function saveDraft(values: DetailValues): Promise<string | null> {
    if (!currentDraft) return null
    const r = currentDraft.result
    const res = await createMediaAsset({
      kind: r.kind,
      url: r.url,
      public_id: r.publicId,
      poster_url: r.posterUrl,
      title: values.name,
      caption: values.description,
      available_for_request: values.available,
      duration: r.duration,
      width: r.width,
      height: r.height,
      format: r.format,
      bytes: r.bytes,
    })
    if (!res.ok || !res.asset) return res.error || 'Save failed'
    setItems((prev) => [res.asset as MediaAsset, ...prev])
    setDrafts((prev) => prev.slice(1))
    router.refresh() // keep totals + ordering in sync with the server
    return null
  }

  // Save edits to an existing item.
  async function saveEdit(values: DetailValues): Promise<string | null> {
    if (!editing) return null
    const res = await updateMediaAsset(editing.id, {
      title: values.name,
      caption: values.description,
      available_for_request: values.available,
    })
    if (!res.ok) return res.error || 'Save failed'
    setItems((prev) =>
      prev.map((it) =>
        it.id === editing.id
          ? { ...it, title: values.name, caption: values.description || null, available_for_request: values.available }
          : it,
      ),
    )
    setEditing(null)
    return null
  }

  // Whole-library totals (all pages), from the server.
  const imageCount = counts.images
  const videoCount = counts.videos

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media"
        description="Upload photos and short videos to the gallery, home slideshow and video reel."
      >
        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {imageCount} photos · {videoCount} videos
        </span>
      </PageHeader>

      {!isCloudinaryConfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Cloudinary isn&apos;t configured yet.</p>
            <p className="mt-1 opacity-90">
              Add <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code>,{' '}
              <code className="rounded bg-black/10 px-1">CLOUDINARY_API_KEY</code> and{' '}
              <code className="rounded bg-black/10 px-1">CLOUDINARY_API_SECRET</code> to your
              environment, then restart. Uploads are disabled until then.
            </p>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (isCloudinaryConfigured) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => isCloudinaryConfigured && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition-colors',
          dragOver ? 'border-[var(--color-primary)] bg-primary/5' : 'border-border hover:border-[var(--color-primary)]/50',
          !isCloudinaryConfigured && 'pointer-events-none opacity-50',
        )}
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-[var(--color-primary)]">
          <UploadCloud className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Drop photos &amp; videos here, or click to browse</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Videos ask for a name &amp; details after upload. Videos must be under 5 minutes.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Active uploads */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm"
            >
              {t.kind === 'video' ? (
                <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              {t.error ? (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> {t.error}
                  <button onClick={() => dropTask(t.id)} className="ml-2 underline">
                    dismiss
                  </button>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                      style={{ width: `${Math.round(t.progress * 100)}%` }}
                    />
                  </div>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No media yet. Upload your first photo or video.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((a) => (
            <div
              key={a.id}
              className={cn(
                'group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-premium-sm',
                !a.is_published && 'opacity-60',
              )}
            >
              <button
                type="button"
                onClick={() => setEditing(a)}
                className="relative aspect-square cursor-pointer bg-navy-dark/5 text-left"
                aria-label="Edit details"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.kind === 'video' ? a.poster_url ?? a.url : a.url}
                  alt={a.title ?? ''}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {a.kind === 'video' && (
                  <>
                    <span className="absolute inset-0 grid place-items-center bg-black/25">
                      <Play className="h-8 w-8 fill-white/90 text-white/90" />
                    </span>
                    {fmtDuration(a.duration) && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                        {fmtDuration(a.duration)}
                      </span>
                    )}
                  </>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                  {a.kind}
                </span>
                {/* Hover: edit hint */}
                <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy-dark shadow">
                    <Pencil className="h-3.5 w-3.5" /> Edit details
                  </span>
                </span>
              </button>

              <div className="flex flex-1 flex-col gap-2 p-2.5">
                <div className="min-h-[2.25rem]">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {a.title || <span className="text-muted-foreground">Untitled</span>}
                  </p>
                  {a.caption && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{a.caption}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => onAvailable(a)}
                    title={a.available_for_request ? 'Available for request (click to make display-only)' : 'Display-only (click to make shoppable)'}
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                      a.available_for_request ? 'bg-primary/10 text-[var(--color-primary)]' : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </button>
                  {a.kind === 'image' ? (
                    <button
                      type="button"
                      onClick={() => onFeature(a)}
                      title={a.featured ? 'Featured on home' : 'Feature on home'}
                      className={cn(
                        'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                        a.featured ? 'bg-amber-500/15 text-amber-500' : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <Star className={cn('h-4 w-4', a.featured && 'fill-current')} />
                    </button>
                  ) : (
                    <span className="grid h-8 w-8 place-items-center text-muted-foreground/50" title="Videos show in the home reel">
                      <Film className="h-4 w-4" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPublish(a)}
                    title={a.is_published ? 'Published (click to hide)' : 'Hidden (click to publish)'}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                  >
                    {a.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(a)}
                    title="Delete"
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaPager page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} />

      {pending && (
        <p className="text-center text-xs text-muted-foreground">Saving…</p>
      )}

      {/* Details modal: naming a new video draft, or editing any item */}
      {currentDraft && (
        <DetailsModal
          key={currentDraft.draftId}
          heading="Add video details"
          subheading={drafts.length > 1 ? `${drafts.length} videos waiting` : undefined}
          kind="video"
          previewUrl={currentDraft.result.posterUrl ?? currentDraft.result.url}
          initial={{ name: suggestName(currentDraft.fileName), description: '', available: true }}
          nameRequired
          submitLabel="Save video"
          onSubmit={saveDraft}
          onClose={() => setDrafts((prev) => prev.slice(1))}
          closeLabel="Skip"
        />
      )}
      {!currentDraft && editing && (
        <DetailsModal
          key={editing.id}
          heading="Edit details"
          kind={editing.kind}
          previewUrl={editing.kind === 'video' ? editing.poster_url ?? editing.url : editing.url}
          initial={{
            name: editing.title ?? '',
            description: editing.caption ?? '',
            available: editing.available_for_request,
          }}
          nameRequired={editing.kind === 'video'}
          submitLabel="Save changes"
          onSubmit={saveEdit}
          onClose={() => setEditing(null)}
          closeLabel="Cancel"
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          asset={confirmDelete}
          deleting={deleting}
          onConfirm={performDelete}
          onClose={() => !deleting && setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

/** Server-side pager for the media grid: a count line plus prev/next buttons. */
function MediaPager({
  page,
  pageCount,
  total,
  pageSize,
}: Pick<Paged<MediaAsset>, 'page' | 'pageCount' | 'total' | 'pageSize'>) {
  const { setParams, pending } = useListNav()
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  // Page 1 is the bare URL (no ?page=1), keeps links clean.
  const go = (p: number) => setParams({ page: p <= 1 ? null : p }, { resetPage: false })

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from.toLocaleString()}–{to.toLocaleString()}</span> of{' '}
        <span className="font-medium text-foreground">{total.toLocaleString()}</span>
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => go(page - 1)}
            disabled={pending || page <= 1}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="px-1 text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <button
            onClick={() => go(page + 1)}
            disabled={pending || page >= pageCount}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

/** Styled confirmation for a permanent delete (file + database row). */
function ConfirmDeleteModal({
  asset,
  deleting,
  onConfirm,
  onClose,
}: {
  asset: MediaAsset
  deleting: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  // Close on Escape for keyboard users (ignored while a delete is in flight).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleting, onClose])

  const previewUrl = asset.kind === 'video' ? asset.poster_url ?? asset.url : asset.url

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-navy-dark/50 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-heading"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-7 w-7" />
          </div>
          <h3
            id="confirm-delete-heading"
            className="mt-4 font-headline text-xl font-bold tracking-tight text-foreground"
          >
            Delete this {asset.kind}?
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This permanently removes the file from Cloudinary and the gallery. This can&apos;t be undone.
          </p>
        </div>

        <div className="mx-6 mt-5 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-left">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-navy-dark/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            {asset.kind === 'video' && (
              <span className="absolute inset-0 grid place-items-center bg-black/25">
                <Play className="h-4 w-4 fill-white/90 text-white/90" />
              </span>
            )}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {asset.title || <span className="text-muted-foreground">Untitled</span>}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-destructive/25 transition-opacity disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface DetailValues {
  name: string
  description: string
  available: boolean
}

function DetailsModal({
  heading,
  subheading,
  kind,
  previewUrl,
  initial,
  nameRequired,
  submitLabel,
  closeLabel,
  onSubmit,
  onClose,
}: {
  heading: string
  subheading?: string
  kind: 'image' | 'video'
  previewUrl: string
  initial: DetailValues
  nameRequired: boolean
  submitLabel: string
  closeLabel: string
  onSubmit: (values: DetailValues) => Promise<string | null>
  onClose: () => void
}) {
  const [name, setName] = React.useState(initial.name)
  const [description, setDescription] = React.useState(initial.description)
  const [available, setAvailable] = React.useState(initial.available)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const canSave = !nameRequired || name.trim().length > 0

  const submit = async () => {
    if (!canSave || saving) return
    setSaving(true)
    setError(null)
    const err = await onSubmit({ name: name.trim(), description: description.trim(), available })
    setSaving(false)
    if (err) setError(err)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-dark/50 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h3 className="font-headline text-xl font-bold tracking-tight text-foreground">{heading}</h3>
            {subheading && <p className="mt-0.5 text-sm text-muted-foreground">{subheading}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-5 px-6 py-5">
          <div className="relative hidden aspect-[9/16] w-28 shrink-0 overflow-hidden rounded-2xl bg-navy-dark/5 ring-1 ring-border sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            {kind === 'video' && (
              <span className="absolute inset-0 grid place-items-center bg-black/20">
                <Play className="h-7 w-7 fill-white/90 text-white/90" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Name {nameRequired && <span className="text-secondary">*</span>}
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={kind === 'video' ? 'e.g. Live-fire ribeye service' : 'e.g. Charcoal grilled platter'}
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="A short line about this moment or dish."
                className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={available}
              onClick={() => setAvailable((v) => !v)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 p-3.5 text-left transition-colors hover:bg-muted/70"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">Available for request</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {available ? 'Guests can add this to a request.' : 'Display-only — shown, but not shoppable.'}
                </span>
              </span>
              <span
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  available ? 'bg-[var(--color-primary)]' : 'bg-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    available ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            {closeLabel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-[#00296b] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-opacity disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
