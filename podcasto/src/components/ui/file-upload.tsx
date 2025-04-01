"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  className?: string;
  accept?: string;
  maxSize?: number;
  buttonText?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileChange,
  className,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  buttonText = "Select file",
  disabled = false,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    // Clear previous file and error states
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    if (!selectedFile) {
      setFile(null);
      onFileChange(null);
      return;
    }
    
    // Validate file size
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds maximum limit (${(maxSize / 1024 / 1024).toFixed(1)}MB)`);
      setFile(null);
      onFileChange(null);
      return;
    }
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
    
    setFile(selectedFile);
    onFileChange(selectedFile);
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFile(null);
    setError(null);
    onFileChange(null);
    
    // Reset the input field
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          <span>{buttonText}</span>
        </Button>
        
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearFile}
            className="h-8 w-8"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {file && (
        <div className="text-sm text-muted-foreground">
          {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </div>
      )}
      
      {previewUrl && (
        <div className="mt-2 overflow-hidden rounded-md border">
          <Image 
            src={previewUrl} 
            alt="Preview" 
            width={128}
            height={128}
            className="h-32 w-auto object-cover"
          />
        </div>
      )}
    </div>
  );
} 