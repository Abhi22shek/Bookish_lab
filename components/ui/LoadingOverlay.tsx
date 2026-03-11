"use client"

import { Loader2 } from "lucide-react"

const LoadingOverlay = () => {
    return (
        <div className="loading-wrapper">
            <div className="loading-shadow-wrapper bg-white">
                <div className="loading-shadow">
                    <Loader2 className="loading-animation w-12 h-12 text-[#663820]" />
                    <h2 className="loading-title font-serif">Synthesizing Your Book...</h2>
                    <div className="loading-progress">
                        <div className="loading-progress-item">
                            <span className="loading-progress-status" />
                            <span className="text-[var(--text-secondary)]">Uploading files</span>
                        </div>
                        <div className="loading-progress-item">
                            <span className="loading-progress-status" />
                            <span className="text-[var(--text-secondary)]">Analyzing content</span>
                        </div>
                        <div className="loading-progress-item">
                            <span className="loading-progress-status" />
                            <span className="text-[var(--text-secondary)]">Preparing AI assistant</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoadingOverlay
