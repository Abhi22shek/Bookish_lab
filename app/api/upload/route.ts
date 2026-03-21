import { MAX_FILE_SIZE } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";


export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody

    try {
        const jsonResponse = await handleUpload({
            token: process.env.BLOB_READ_WRITE_TOKEN,
            body, request, onBeforeGenerateToken: async () => {
                const { userId } = await auth();

                if (!userId) {
                    throw new Error("Unauthorized")
                }

                return {
                    allowedContentTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
                    maximumSizeInBytes: MAX_FILE_SIZE,
                    tokenPayload: JSON.stringify({ userId }),
                    validUntil: Date.now() + 1000 * 60 * 10,
                    addRandomSuffix: true,
                    allowOverwrite: true,
                    cacheControlMaxAge: 60 * 60 * 24 * 365,
                    ifMatch: undefined,
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log("Upload completed:", blob.url);
                const payload = tokenPayload ? JSON.parse(tokenPayload as string) : null;

                const userId = payload?.userId;

                if (!userId) {
                    throw new Error("Unauthorized")
                }
            }
        })

        return NextResponse.json(jsonResponse)
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to upload"
        const status = error instanceof Error && error.message.includes("401") ? 401 : 500
        return NextResponse.json({ error: message }, { status })
    }
}