declare module 'tui-image-editor' {
  interface ImageEditorOptions {
    includeUI?: {
      loadImage?: { path: string; name: string };
      theme?: Record<string, string>;
      menu?: string[];
      initMenu?: string;
      uiSize?: { width: string; height: string };
      menuBarPosition?: string;
    };
    cssMaxWidth?: number;
    cssMaxHeight?: number;
    usageStatistics?: boolean;
  }

  export default class ImageEditor {
    constructor(element: HTMLElement | string, options?: ImageEditorOptions);
    toDataURL(options?: { format?: string; quality?: number }): string;
    destroy(): void;
    loadImageFromURL(url: string, name: string): Promise<void>;
  }
}
