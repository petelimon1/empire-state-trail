'use client';

import { useState, useEffect } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { Photo } from '@/types';

interface PhotoGalleryProps {
  dayId: number;
  isAdmin?: boolean;
}

export default function PhotoGallery({ dayId, isAdmin = false }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [dayId]);

  async function fetchPhotos() {
    try {
      const response = await fetch(`/api/photos?dayId=${dayId}`);
      const data = await response.json();
      if (!response.ok) {
        setFetchError(data.error || 'Failed to load photos');
        return;
      }
      if (Array.isArray(data)) setPhotos(data);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      setFetchError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    for (const file of Array.from(files)) {
      // Allow files with no type (HEIC on some browsers reports empty type)
      if (file.type && !file.type.startsWith('image/')) continue;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dayId', String(dayId));

      try {
        const response = await fetch('/api/photos', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          setUploadError(data.error || 'Upload failed');
          continue;
        }
        if (data.photo) {
          setPhotos((prev) => [...prev, data.photo]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadError('Upload failed — check your connection');
      }
    }
    setUploading(false);
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Delete this photo?')) return;
    try {
      await fetch(`/api/photos?id=${photoId}`, { method: 'DELETE' });
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (lightboxIndex !== null) setLightboxIndex(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  function handleCaptionChange(photoId: string, caption: string) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, caption } : p)));
  }

  // Grows a caption textarea to fit its content — called on mount (via ref)
  // and on every keystroke, so a long caption is fully visible while editing.
  function autoGrow(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  async function saveCaption(photoId: string, caption: string) {
    try {
      await fetch('/api/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: photoId, caption }),
      });
    } catch (err) {
      console.error('Caption save failed:', err);
    }
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    setLightboxIndex(null);
    document.body.style.overflow = '';
  }

  function prevPhoto() {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1);
  }

  function nextPhoto() {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1);
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, photos.length]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-highland-purple" />
          Photos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-highland-purple" />
          Photos
          {photos.length > 0 && (
            <span className="text-sm font-normal text-slate-500 font-body">({photos.length})</span>
          )}
        </h3>

        {/* Upload zone (admin only) */}
        {isAdmin && (
          <label
            htmlFor={`photo-input-${dayId}`}
            className={`mb-4 border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer block ${
              dragOver
                ? 'border-highland-purple bg-purple-500/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleUpload(e.dataTransfer.files);
            }}
          >
            <input
              id={`photo-input-${dayId}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            {uploading ? (
              <p className="text-slate-400 text-sm">Uploading...</p>
            ) : (
              <>
                <p className="text-slate-400 text-sm font-medium">Drop photos here or click to upload</p>
                <p className="text-slate-600 text-xs mt-1">Supports JPG, PNG, HEIC, WEBP</p>
              </>
            )}
          </label>
        )}

        {uploadError && (
          <p className="mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            Upload failed: {uploadError}
          </p>
        )}

        {fetchError && (
          <p className="mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {fetchError}
          </p>
        )}

        {photos.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No photos yet</p>
            {!isAdmin && <p className="text-xs mt-1 text-slate-700">Photos will appear here during and after the ride</p>}
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 gap-2">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative break-inside-avoid mb-2 rounded-lg overflow-hidden bg-slate-900/40">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.public_url}
                    alt={photo.caption || `Photo ${index + 1}`}
                    className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
                {isAdmin ? (
                  <textarea
                    value={photo.caption || ''}
                    onChange={(e) => {
                      handleCaptionChange(photo.id, e.target.value);
                      autoGrow(e.target);
                    }}
                    onBlur={(e) => saveCaption(photo.id, e.target.value)}
                    ref={autoGrow}
                    rows={1}
                    placeholder="Add a caption..."
                    className="w-full bg-slate-900/80 text-slate-300 placeholder-slate-600 text-xs px-2 py-1.5 outline-none border-t border-slate-800 focus:bg-slate-800 resize-none overflow-hidden block"
                  />
                ) : (
                  photo.caption && (
                    <p className="text-slate-500 text-xs px-2 py-1.5 border-t border-slate-800/60 whitespace-pre-wrap">{photo.caption}</p>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white p-2 transition-colors z-10"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2 transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full mx-8 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={photos[lightboxIndex].public_url}
                alt={photos[lightboxIndex].caption || 'Photo'}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {photos[lightboxIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4 text-center">
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{photos[lightboxIndex].caption}</p>
              </div>
            )}
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2 transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500 text-xs">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
