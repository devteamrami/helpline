/**
 * FAQ Form Dialog Component
 * Modal with CKEditor 5 rich-text editor for the Answer field.
 * Supports: bold/italic/headings/lists/tables/images/links/code blocks.
 * Image editing (crop, draw, annotate) via tui-image-editor overlay.
 */

import {
  Component, OnInit, OnDestroy, inject, ElementRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

import {
  ClassicEditor,
  Bold, Italic, Underline, Strikethrough,
  Heading,
  FontColor, FontBackgroundColor, FontSize, FontFamily,
  Link,
  List, TodoList,
  BlockQuote,
  Table, TableToolbar,
  Code, CodeBlock,
  HorizontalLine,
  Indent, IndentBlock,
  Alignment,
  Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert,
  FileRepository,
  MediaEmbed,
  RemoveFormat,
  Undo,
} from 'ckeditor5';

import { environment } from '../../../../../environments/environment';
import { FaqService } from '../../services/faq.service';
import { Faq } from '../../models/ticket.model';
import { FaqUploadAdapterPlugin } from './faq-upload-adapter';
import { ImageEditorComponent } from '../../../../shared/components/image-editor/image-editor.component';

export interface FaqFormDialogData {
  mode: 'create' | 'edit';
  faq?: Faq;
}

@Component({
  selector: 'app-faq-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CKEditorModule, ImageEditorComponent],
  templateUrl: './faq-form-dialog.component.html',
  styleUrls: ['./faq-form-dialog.component.scss'],
})
export class FaqFormDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  private fb = inject(FormBuilder);
  private faqService = inject(FaqService);
  private el = inject(ElementRef);
  private destroy$ = new Subject<void>();

  // Set from parent
  data: FaqFormDialogData = { mode: 'create' };

  faqForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  // CKEditor
  readonly Editor = ClassicEditor;
  editorConfig: any;
  answerHtml = '';
  private editorInstance: any = null;

  // Image editor overlay (uses reusable <app-image-editor>)
  showImageEditor = false;
  isApplyingEdit = false;   // shows loading overlay while uploading to Spaces
  applyEditError = '';
  resolvedImageSrc: string | null = null;  // src passed to the editor component
  private currentImgElement: HTMLImageElement | null = null;

  // Callbacks
  onClose?: () => void;
  onSuccess?: (faq: Faq) => void;

  ngOnInit(): void {
    // Ensure the page is always LTR — tui-image-editor can set body dir="rtl"
    document.body.removeAttribute('dir');
    document.documentElement.setAttribute('dir', 'ltr');

    this.answerHtml = this.data.faq?.answer || '';

    this.faqForm = this.fb.group({
      question: [
        this.data.faq?.question || '',
        [Validators.required, Validators.maxLength(500)],
      ],
      // answer is managed via CKEditor, not a form control
    });

    this.editorConfig = {
      plugins: [
        Bold, Italic, Underline, Strikethrough,
        Heading,
        FontColor, FontBackgroundColor, FontSize, FontFamily,
        Link,
        List, TodoList,
        BlockQuote,
        Table, TableToolbar,
        Code, CodeBlock,
        HorizontalLine,
        Indent, IndentBlock,
        Alignment,
        Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert,
        FileRepository,
        MediaEmbed,
        RemoveFormat,
        Undo,
        // Custom upload adapter — handles toolbar upload, drag-drop, AND paste
        FaqUploadAdapterPlugin(this.getAuthToken.bind(this)),
      ],
      toolbar: {
        items: [
          'undo', 'redo', '|',
          'heading', '|',
          'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
          'bold', 'italic', 'underline', 'strikethrough', 'removeFormat', '|',
          'alignment', '|',
          'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent', '|',
          'link', 'insertImage', 'mediaEmbed', 'insertTable', 'blockQuote', 'codeBlock', 'horizontalLine',
        ],
        shouldNotGroupWhenFull: true,
      },
      image: {
        toolbar: [
          'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|',
          'toggleImageCaption', 'imageTextAlternative', '|',
          'resizeImage',
        ],
      },
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
      },
      placeholder: 'Write the FAQ answer here. You can add text formatting, lists, tables, images and more...',
      licenseKey: 'GPL',
      language: 'en',
    };
  }

  ngAfterViewInit(): void {
    // Click detection is now handled via CKEditor's view document in onEditorReady
    // to reliably detect image clicks regardless of DOM placement.
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getAuthToken(): string {
    try {
      const raw = localStorage.getItem(environment.tokenKey);
      return raw ? JSON.parse(raw) : '';
    } catch {
      return '';
    }
  }

  // ── CKEditor ready handler ─────────────────────────────────────────────────

  onEditorReady(editor: any): void {
    this.editorInstance = editor;

    // Listen for clicks inside the editor via CKEditor's view document
    editor.editing.view.document.on('click', (_evt: any, data: any) => {
      const domTarget = editor.editing.view.domConverter.mapViewToDom(data.target);
      if (domTarget && domTarget.tagName === 'IMG') {
        // Small delay to let CKEditor finish its own click handling
        setTimeout(() => this.openImageEditor(domTarget as HTMLImageElement), 10);
      }
    });
  }

  onEditorChange(_event: any): void {
    // Intentionally empty — we read data on submit to avoid cursor reset.
  }

  // ── Image editing (reusable <app-image-editor>) ─────────────────────────────

  isLoadingImageForEditor = false;

  openImageEditor(imgEl: HTMLImageElement): void {
    this.currentImgElement = imgEl;
    this.isLoadingImageForEditor = true;
    this.applyEditError = '';
    this.resolvedImageSrc = null;
    this.showImageEditor = true;

    // Strip cache-busting param
    const cleanSrc = imgEl.src.includes('?') ? imgEl.src.split('?')[0] : imgEl.src;

    // If the image is already a data URL (just edited), use it directly — instant
    if (cleanSrc.startsWith('data:')) {
      this.resolvedImageSrc = cleanSrc;
      this.isLoadingImageForEditor = false;
    } else {
      // For remote Spaces images, fetch via proxy and convert to data URL
      this.resolveRemoteImage(cleanSrc);
    }
  }

  private async resolveRemoteImage(imageSrc: string): Promise<void> {
    let loadSrc = imageSrc;
    if (imageSrc.includes('digitaloceanspaces.com')) {
      const proxyUrl = `${environment.apiUrl}/faqs/proxy-image?url=${encodeURIComponent(imageSrc)}`;
      try {
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const blob = await response.blob();
          loadSrc = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch {
        // fallback to proxy URL directly
        loadSrc = `${environment.apiUrl}/faqs/proxy-image?url=${encodeURIComponent(imageSrc)}`;
      }
    }
    this.resolvedImageSrc = loadSrc;
    this.isLoadingImageForEditor = false;
  }

  /**
   * Handler for the reusable editor's (apply) output.
   * Receives the edited image as a data URL, uploads it to Spaces,
   * updates the CKEditor model + DOM img, then closes.
   */
  onImageEditorApply(dataUrl: string): void {
    if (!dataUrl || !this.currentImgElement) {
      this.closeImageEditor();
      return;
    }

    const imgEl = this.currentImgElement;
    const token = this.getAuthToken();

    // INSTANT: show the edited image immediately as data URL in the editor
    imgEl.src = dataUrl;

    this.isApplyingEdit = true;
    this.applyEditError = '';

    // Always upload as a NEW file (fresh UUID key) — bypasses CDN caching entirely.
    fetch(dataUrl)
      .then(r => r.blob())
      .then(blob => {
        const formData = new FormData();
        formData.append('upload', new File([blob], 'edited.jpg', { type: 'image/jpeg' }));
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        return fetch(`${environment.apiUrl}/faqs/upload-image`, {
          method: 'POST',
          headers,
          body: formData,
        });
      })
      .then(res => (res as Response).json())
      .then(json => {
        this.isApplyingEdit = false;
        if (json.url) {
          // Update CKEditor model with the new Spaces URL
          if (this.editorInstance) {
            try {
              const root = this.editorInstance.model.document.getRoot();
              for (const child of root.getChildren()) {
                if (child.is('element', 'imageBlock') || child.is('element', 'imageInline')) {
                  const src = child.getAttribute('src');
                  if (src && (src === dataUrl || src.startsWith('data:'))) {
                    this.editorInstance.model.change((writer: any) => {
                      writer.setAttribute('src', json.url, child);
                    });
                    break;
                  }
                }
              }
            } catch {}
          }
          // Also update the DOM img src to the new URL
          imgEl.src = json.url;
          this.closeImageEditor();
        } else {
          this.applyEditError = json.error?.message || 'Upload failed. Please try again.';
        }
      })
      .catch(err => {
        this.isApplyingEdit = false;
        this.applyEditError = 'Upload failed. Please try again.';
        console.error('[ImageEditor] Upload failed:', err);
      });
  }

  closeImageEditor(): void {
    this.showImageEditor = false;
    this.resolvedImageSrc = null;
    this.currentImgElement = null;
    this.applyEditError = '';
    this.isApplyingEdit = false;
  }

  // ── Form submit ────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.faqForm.invalid) {
      Object.keys(this.faqForm.controls).forEach(k => this.faqForm.get(k)?.markAsTouched());
      return;
    }

    if (!this.answerHtml || this.answerHtml.trim() === '' || this.answerHtml === '<p>&nbsp;</p>') {
      // Also check the live editor if available
      const liveData = this.editorInstance ? this.editorInstance.getData() : '';
      if (!liveData || liveData.trim() === '' || liveData === '<p>&nbsp;</p>') {
        this.errorMessage = 'Answer is required';
        return;
      }
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { question } = this.faqForm.value;
    // Read the current editor content at submit time — not from reactive binding
    const answer = this.editorInstance ? this.editorInstance.getData() : this.answerHtml;

    if (this.data.mode === 'create') {
      this.faqService.createFaq({ question, answer })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (faq) => { this.isSubmitting = false; this.onSuccess?.(faq); this.close(); },
          error: (err) => { this.isSubmitting = false; this.errorMessage = err.message || 'Failed to create FAQ'; },
        });
    } else {
      this.faqService.updateFaq(this.data.faq!.id, { question, answer })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (faq) => { this.isSubmitting = false; this.onSuccess?.(faq); this.close(); },
          error: (err) => { this.isSubmitting = false; this.errorMessage = err.message || 'Failed to update FAQ'; },
        });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getTitle(): string { return this.data.mode === 'create' ? 'Create New FAQ' : 'Edit FAQ'; }
  getSubmitButtonText(): string {
    if (this.isSubmitting) return this.data.mode === 'create' ? 'Creating...' : 'Updating...';
    return this.data.mode === 'create' ? 'Create FAQ' : 'Update FAQ';
  }
  questionLength(): number { return this.faqForm.get('question')?.value?.length ?? 0; }
  getErrorMessage(controlName: string): string {
    const control = this.faqForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';
    if (control.errors['required']) return 'Question is required';
    if (control.errors['maxlength']) return `Question must not exceed ${control.errors['maxlength'].requiredLength} characters`;
    return 'Invalid value';
  }
  close(): void { this.onClose?.(); }
}
