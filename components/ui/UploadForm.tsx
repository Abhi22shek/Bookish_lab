"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload, ImagePlus, X } from "lucide-react"
import { toast } from 'sonner'

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form"
import LoadingOverlay from "@/components/ui/LoadingOverlay"
import {
    voiceOptions,
    voiceCategories,
    DEFAULT_VOICE,
    MAX_FILE_SIZE,
    ACCEPTED_PDF_TYPES,
    MAX_IMAGE_SIZE,
    ACCEPTED_IMAGE_TYPES,
} from "@/lib/constants"
import { useAuth } from "@clerk/clerk-react"
import { checkBookExists, createBook, saveBookSegments } from "@/lib/actions/book.actions"
import { useRouter } from "next/navigation"
import { parsePDFFile } from "@/lib/utils"
import { upload } from "@vercel/blob/client"

// ── Zod Schema ──────────────────────────────────────────────
const uploadFormSchema = z.object({
    pdf: z
        .instanceof(File, { message: "Please upload a PDF file" })
        .refine((f) => f.size <= MAX_FILE_SIZE, "File must be less than 50MB")
        .refine(
            (f) => ACCEPTED_PDF_TYPES.includes(f.type),
            "Only PDF files are accepted"
        ),
    coverImage: z
        .array(z.instanceof(File))
        .refine(
            (files) => files.length === 0 || files[0].size <= MAX_IMAGE_SIZE,
            "Image must be less than 10MB"
        )
        .refine(
            (files) => files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
            "Only JPEG, PNG, and WebP images are accepted"
        ),
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    author: z
        .string()
        .min(1, "Author name is required")
        .max(100, "Author name is too long"),
    persona: z.string().min(1, "Please select a voice"),
})

type UploadFormValues = z.infer<typeof uploadFormSchema>

// ── Component ───────────────────────────────────────────────
const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const { userId } = useAuth()
    const router = useRouter()

    const form = useForm<UploadFormValues>({
        resolver: zodResolver(uploadFormSchema),
        defaultValues: {
            title: "",
            author: "",
            persona: DEFAULT_VOICE,
            pdf: undefined,
            coverImage: [],
        },
    })

    const pdfFile = form.watch("pdf")
    const coverFile = form.watch("coverImage")

    const onSubmit = async (data: UploadFormValues) => {
        if (!userId) {
            return toast.error("please login to upload books")
        }
        setIsSubmitting(true)

        //posthog -> track upload book


        try {
            const existsCheck = await checkBookExists(data.title);
            if (existsCheck.exists && existsCheck.data) {
                toast.info("Book already exists")
                form.reset()
                router.push(`/books/${existsCheck.data.slug}`)
                return;
            }

            const fileTitle = data.title.replace(/\s+/g, "-").toLowerCase();
            const pdfFile = data.pdf;

            const parsedPdf = await parsePDFFile(pdfFile);

            if (parsedPdf.content.length === 0) {
                toast.error("Failed to parse PDF, Please try again with a different file")
                return;
            }

            const uploadPdfBlob = await upload(fileTitle, pdfFile, {
                access: "public",
                handleUploadUrl: '/api/upload',
                contentType: 'application/pdf'
            })

            let coverUrl: string

            if (data.coverImage && data.coverImage.length > 0) {
                const coverFile = data.coverImage[0];
                const uploadCoverBlob = await upload(`${fileTitle}_cover.png`, coverFile, {
                    access: "public",
                    handleUploadUrl: '/api/upload',
                    contentType: coverFile.type,
                })
                coverUrl = uploadCoverBlob.url;
            } else {
                const response = await fetch(parsedPdf.cover)
                const blob = await response.blob();
                const uploadCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
                    access: "public",
                    handleUploadUrl: '/api/upload',
                    contentType: "image/png",
                })
                coverUrl = uploadCoverBlob.url;
            }

            const book = await createBook({
                clerkId: userId,
                title: data.title,
                author: data.author,
                persona: data.persona,
                fileURL: uploadPdfBlob.url,
                fileBlobKey: uploadPdfBlob.pathname,
                coverURL: coverUrl,
                fileSize: pdfFile.size
            })

            if (!book.success) throw new Error("Failed to create book")

            const segments = await saveBookSegments(book.data._id, parsedPdf.content, userId);

            if (!segments.success) throw new Error("Failed to save segments")

            toast.success("Book uploaded successfully")
            form.reset()
            router.push(`/`)

        } catch (error) {
            console.error("Error uploading book:", error)
            toast.error("Failed to upload book")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {isSubmitting && <LoadingOverlay />}

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="new-book-wrapper space-y-8"
                >
                    {/* ── PDF Upload ──────────────────── */}
                    <FormField
                        control={form.control}
                        name="pdf"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="form-label">
                                    Book PDF File
                                </FormLabel>
                                <FormControl>
                                    <div>
                                        <input
                                            ref={pdfInputRef}
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) field.onChange(file)
                                            }}
                                        />
                                        {!pdfFile ? (
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => pdfInputRef.current?.click()}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pdfInputRef.current?.click() }}
                                                className="upload-dropzone border-2 border-dashed border-[var(--border-medium)]"
                                            >
                                                <Upload className="upload-dropzone-icon" />
                                                <span className="upload-dropzone-text">
                                                    Click to upload PDF
                                                </span>
                                                <span className="upload-dropzone-hint">
                                                    PDF file (max 50MB)
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="upload-dropzone upload-dropzone-uploaded border-2 border-dashed border-[#663820]/30">
                                                <div className="flex items-center gap-3">
                                                    <span className="upload-dropzone-text font-semibold">
                                                        {pdfFile.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="upload-dropzone-remove"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            field.onChange(undefined)
                                                            if (pdfInputRef.current)
                                                                pdfInputRef.current.value = ""
                                                        }}
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ── Cover Image Upload ─────────── */}
                    <FormField
                        control={form.control}
                        name="coverImage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="form-label">
                                    Cover Image (Optional)
                                </FormLabel>
                                <FormControl>
                                    <div>
                                        <input
                                            ref={coverInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) field.onChange([file])
                                            }}
                                        />
                                        {!coverFile || coverFile.length === 0 ? (
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => coverInputRef.current?.click()}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') coverInputRef.current?.click() }}
                                                className="upload-dropzone border-2 border-dashed border-[var(--border-medium)]"
                                            >
                                                <ImagePlus className="upload-dropzone-icon" />
                                                <span className="upload-dropzone-text">
                                                    Click to upload cover image
                                                </span>
                                                <span className="upload-dropzone-hint">
                                                    Leave empty to auto-generate from PDF
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="upload-dropzone upload-dropzone-uploaded border-2 border-dashed border-[#663820]/30">
                                                <div className="flex items-center gap-3">
                                                    <span className="upload-dropzone-text font-semibold">
                                                        {coverFile[0].name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="upload-dropzone-remove"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            field.onChange([])
                                                            if (coverInputRef.current)
                                                                coverInputRef.current.value = ""
                                                        }}
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ── Title Input ─────────────────── */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="form-label">Title</FormLabel>
                                <FormControl>
                                    <input
                                        {...field}
                                        type="text"
                                        className="form-input border border-[var(--border-subtle)] focus:border-[var(--accent-warm)] focus:outline-none transition-colors"
                                        placeholder="ex: Rich Dad Poor Dad"
                                        id="book-title"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ── Author Input ────────────────── */}
                    <FormField
                        control={form.control}
                        name="author"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="form-label">
                                    Author Name
                                </FormLabel>
                                <FormControl>
                                    <input
                                        {...field}
                                        type="text"
                                        className="form-input border border-[var(--border-subtle)] focus:border-[var(--accent-warm)] focus:outline-none transition-colors"
                                        placeholder="ex: Robert Kiyosaki"
                                        id="book-author"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ── Voice Selector ──────────────── */}
                    <FormField
                        control={form.control}
                        name="persona"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="form-label">
                                    Choose Assistant Voice
                                </FormLabel>
                                <FormControl>
                                    <div className="space-y-5">
                                        {/* Male Voices */}
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3 italic font-serif">
                                                Male Voices
                                            </p>
                                            <div className="voice-selector-options">
                                                {voiceCategories.male.map(
                                                    (key) => {
                                                        const voice =
                                                            voiceOptions[
                                                            key as keyof typeof voiceOptions
                                                            ]
                                                        const isSelected =
                                                            field.value === key
                                                        return (
                                                            <label
                                                                key={key}
                                                                className={`voice-selector-option ${isSelected
                                                                    ? "voice-selector-option-selected"
                                                                    : "voice-selector-option-default"
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="voice"
                                                                    value={key}
                                                                    checked={isSelected}
                                                                    onChange={() =>
                                                                        field.onChange(
                                                                            key
                                                                        )
                                                                    }
                                                                    className="sr-only"
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected
                                                                            ? "border-[var(--accent-warm)]"
                                                                            : "border-[var(--border-medium)]"
                                                                            }`}
                                                                    >
                                                                        {isSelected && (
                                                                            <div className="w-2 h-2 rounded-full bg-[var(--accent-warm)]" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-sm text-[var(--text-primary)]">
                                                                            {voice.name}
                                                                        </p>
                                                                        <p className="text-xs text-[var(--text-secondary)] leading-tight mt-0.5">
                                                                            {voice.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        )
                                                    }
                                                )}
                                            </div>
                                        </div>

                                        {/* Female Voices */}
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3 italic font-serif">
                                                Female Voices
                                            </p>
                                            <div className="voice-selector-options">
                                                {voiceCategories.female.map(
                                                    (key) => {
                                                        const voice =
                                                            voiceOptions[
                                                            key as keyof typeof voiceOptions
                                                            ]
                                                        const isSelected =
                                                            field.value === key
                                                        return (
                                                            <label
                                                                key={key}
                                                                className={`voice-selector-option ${isSelected
                                                                    ? "voice-selector-option-selected"
                                                                    : "voice-selector-option-default"
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="voice"
                                                                    value={key}
                                                                    checked={isSelected}
                                                                    onChange={() =>
                                                                        field.onChange(
                                                                            key
                                                                        )
                                                                    }
                                                                    className="sr-only"
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected
                                                                            ? "border-[var(--accent-warm)]"
                                                                            : "border-[var(--border-medium)]"
                                                                            }`}
                                                                    >
                                                                        {isSelected && (
                                                                            <div className="w-2 h-2 rounded-full bg-[var(--accent-warm)]" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-sm text-[var(--text-primary)]">
                                                                            {voice.name}
                                                                        </p>
                                                                        <p className="text-xs text-[var(--text-secondary)] leading-tight mt-0.5">
                                                                            {voice.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        )
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ── Submit Button ───────────────── */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="form-btn"
                        id="submit-book"
                    >
                        {isSubmitting ? "Synthesizing..." : "Begin Synthesis"}
                    </button>
                </form>
            </Form>
        </>
    )
}

export default UploadForm