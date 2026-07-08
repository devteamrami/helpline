/**
 * Image Editor Component (reusable, modular)
 *
 * A fullscreen, dark-themed wrapper around tui-image-editor.
 * Designed to be dropped into any page/dialog that needs image annotation
 * (crop, draw, text, shapes, filters, etc.).
 *
 * Usage:
 *   <app-image-editor
 *     [imageSrc]="resolvedDataUrlOrRemoteUrl"
 *     [saving]="isSaving"
 *     [errorMessage]="err"
 *     title="Edit Image"
 *     subtitle="Crop, draw, annotate and more"
 *     (apply)="onApply($event)"   // $event = edited image data URL (JPEG)
 *     (cancel)="onCancel()">
 *   </app-image-editor>
 *
 * The host is responsible for resolving remote images to a loadable src
 * (e.g. via a proxy → data URL) and for persisting the returned data URL.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.scss'],
})
export class ImageEditorComponent implements OnChanges, OnDestroy {
  /** The image source to load (data URL or a directly-loadable URL). */
  @Input() imageSrc: string | null = null;

  /** Whether a save/upload is in progress (shows spinner on Apply). */
  @Input() saving = false;

  /** Optional error message shown at the bottom of the panel. */
  @Input() errorMessage = '';

  /** Header title. */
  @Input() title = 'Edit Image';

  /** Header subtitle / hint. */
  @Input() subtitle = 'Crop, draw, add text, shapes and apply filters.';

  /** Output format for the applied image. */
  @Input() outputFormat: 'jpeg' | 'png' = 'jpeg';

  /** Output quality (0-1) for JPEG. */
  @Input() outputQuality = 0.9;

  /** Emits the edited image as a data URL when the user clicks Apply. */
  @Output() apply = new EventEmitter<string>();

  /** Emits when the user cancels/closes the editor. */
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('editorMount', { static: true }) editorMount!: ElementRef<HTMLDivElement>;

  isLoading = false;
  private tuiEditor: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageSrc'] && this.imageSrc) {
      this.initEditor(this.imageSrc);
    }
  }

  ngOnDestroy(): void {
    this.destroyEditor();
    // tui-image-editor can flip the document direction — restore it.
    document.body.removeAttribute('dir');
    document.documentElement.setAttribute('dir', 'ltr');
  }

  private async initEditor(src: string): Promise<void> {
    if (!this.editorMount?.nativeElement) return;

    this.isLoading = true;
    // Defer so the overlay/mount is painted before heavy init.
    await new Promise((r) => setTimeout(r, 30));

    const ImageEditor = (await import('tui-image-editor')).default;
    this.destroyEditor();

    this.tuiEditor = new ImageEditor(this.editorMount.nativeElement, {
      includeUI: {
        loadImage: { path: src, name: 'Image' },
        theme: this.buildTheme(),
        menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
        initMenu: 'draw',
        uiSize: { width: '100%', height: '100%' },
        menuBarPosition: 'bottom',
      },
      cssMaxWidth: 3000,
      cssMaxHeight: 2000,
      usageStatistics: false,
    });

    this.isLoading = false;
    // Force LTR — tui can set dir="rtl" on body.
    document.body.removeAttribute('dir');
    document.documentElement.setAttribute('dir', 'ltr');
  }

  /** Dark, brand-aligned theme for tui-image-editor. */
  private buildTheme(): any {
    return {
      'common.bi.image': '',
      'common.bisize.width': '0px',
      'common.bisize.height': '0px',
      'common.backgroundImage': 'none',
      'common.backgroundColor': '#15181c',
      'common.border': '0px',

      // Header is hidden via CSS (we use our own), but keep colors consistent.
      'header.backgroundImage': 'none',
      'header.backgroundColor': 'transparent',
      'header.border': '0px',

      'loadButton.backgroundColor': '#3d99fc',
      'loadButton.border': 'none',
      'loadButton.color': '#fff',
      'loadButton.fontFamily': 'inherit',
      'loadButton.fontSize': '13px',
      'downloadButton.backgroundColor': '#3d99fc',
      'downloadButton.border': 'none',
      'downloadButton.color': '#fff',
      'downloadButton.fontFamily': 'inherit',
      'downloadButton.fontSize': '13px',

      'menu.normalIcon.color': '#a8b0bd',
      'menu.activeIcon.color': '#3d99fc',
      'menu.disabledIcon.color': '#4a5058',
      'menu.hoverIcon.color': '#ffffff',
      'menu.iconSize.width': '24px',
      'menu.iconSize.height': '24px',

      'submenu.normalIcon.color': '#a8b0bd',
      'submenu.activeIcon.color': '#3d99fc',
      'submenu.iconSize.width': '32px',
      'submenu.iconSize.height': '32px',

      'submenu.backgroundColor': '#1e2228',
      'submenu.partition.color': 'rgba(255,255,255,0.1)',

      'submenu.normalLabel.color': '#a8b0bd',
      'submenu.normalLabel.fontWeight': '500',
      'submenu.activeLabel.color': '#ffffff',
      'submenu.activeLabel.fontWeight': '600',

      'checkbox.border': '1px solid #3d99fc',
      'checkbox.backgroundColor': '#1e2228',

      'range.pointer.color': '#3d99fc',
      'range.bar.color': '#4a5058',
      'range.subbar.color': '#3d99fc',
      'range.value.color': '#ffffff',
      'range.value.fontWeight': '600',
      'range.value.fontSize': '12px',
      'range.value.border': '1px solid #3d99fc',
      'range.value.backgroundColor': '#15181c',
      'range.title.color': '#a8b0bd',
      'range.title.fontWeight': '500',

      'colorpicker.button.border': '1px solid #3d99fc',
      'colorpicker.title.color': '#ffffff',
    };
  }

  onApply(): void {
    if (!this.tuiEditor) {
      this.apply.emit('');
      return;
    }
    const dataUrl = this.tuiEditor.toDataURL({
      format: this.outputFormat,
      quality: this.outputQuality,
    });
    this.apply.emit(dataUrl);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private destroyEditor(): void {
    if (this.tuiEditor) {
      try {
        this.tuiEditor.destroy();
      } catch {
        /* noop */
      }
      this.tuiEditor = null;
    }
  }
}
