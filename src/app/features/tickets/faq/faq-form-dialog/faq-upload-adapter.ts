/**
 * FAQ CKEditor Upload Adapter
 * Intercepts ALL image insertions (toolbar upload, drag-drop, paste)
 * and uploads them to S3 via the backend endpoint.
 * Returns the S3 URL so the database stores a URL, never base64.
 */

import { environment } from '../../../../../environments/environment';

export class FaqUploadAdapter {
  private uploadUrl = `${environment.apiUrl}/faqs/upload-image`;

  constructor(private loader: any, private getToken: () => string) {}

  upload(): Promise<{ default: string }> {
    return this.loader.file.then(
      (file: File) =>
        new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('upload', file, file.name);

          const xhr = new XMLHttpRequest();
          xhr.open('POST', this.uploadUrl, true);

          const token = this.getToken();
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              if (response.url) {
                resolve({ default: response.url, key: response.key });
              } else {
                reject(response.error?.message || 'Upload failed');
              }
            } else {
              try {
                const err = JSON.parse(xhr.responseText);
                reject(err.error?.message || 'Upload failed');
              } catch {
                reject('Upload failed');
              }
            }
          };

          xhr.onerror = () => reject('Upload network error');

          // Report upload progress to CKEditor
          if (xhr.upload) {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                this.loader.uploadTotal = e.total;
                this.loader.uploaded = e.loaded;
              }
            };
          }

          xhr.send(formData);
        })
    );
  }

  abort(): void {}
}

/**
 * Plugin factory to register the custom upload adapter with CKEditor.
 * Pass this as a plugin in the editor config.
 */
export function FaqUploadAdapterPlugin(getToken: () => string) {
  return function (editor: any): void {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new FaqUploadAdapter(loader, getToken);
    };
  };
}
