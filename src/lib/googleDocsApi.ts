export interface GoogleDriveFolder {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
}

export interface GoogleDocSummary {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
  webViewLink?: string;
  iconLink?: string;
  parents?: string[];
}

export interface GoogleDocContent {
  documentId: string;
  title: string;
  extractedText: string;
  headings: string[];
  revisionId?: string;
}

/**
 * Lists Google Drive Folders.
 */
export async function listGoogleDriveFolders(accessToken: string, query?: string): Promise<GoogleDriveFolder[]> {
  try {
    let q = "mimeType='application/vnd.google-apps.folder' and trashed=false";
    if (query && query.trim()) {
      const sanitized = query.replace(/'/g, "\\'");
      q += ` and name contains '${sanitized}'`;
    }

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id, name, createdTime, modifiedTime, owners)');
    url.searchParams.set('pageSize', '50');
    url.searchParams.set('orderBy', 'name asc');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to fetch folders (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Error fetching Google Drive folders:', error);
    throw error;
  }
}

/**
 * Lists all Google Docs located inside a specific folder (or subfolders).
 */
export async function listGoogleDocsInFolder(folderId: string, accessToken: string): Promise<GoogleDocSummary[]> {
  try {
    const q = `mimeType='application/vnd.google-apps.document' and '${folderId}' in parents and trashed=false`;
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id, name, createdTime, modifiedTime, owners, webViewLink, iconLink, parents)');
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('orderBy', 'modifiedTime desc');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to fetch documents in folder (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Error fetching docs in folder:', error);
    throw error;
  }
}

/**
 * Lists Google Docs from the user's Google Drive.
 */
export async function listGoogleDocs(accessToken: string, query?: string): Promise<GoogleDocSummary[]> {
  try {
    let q = "mimeType='application/vnd.google-apps.document' and trashed=false";
    if (query && query.trim()) {
      const sanitized = query.replace(/'/g, "\\'");
      q += ` and name contains '${sanitized}'`;
    }

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id, name, createdTime, modifiedTime, owners, webViewLink, iconLink)');
    url.searchParams.set('pageSize', '30');
    url.searchParams.set('orderBy', 'modifiedTime desc');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to fetch Google Docs (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Error fetching Google Docs list:', error);
    throw error;
  }
}

/**
 * Fetches a single Google Document by ID and parses its body elements.
 */
export async function getGoogleDoc(documentId: string, accessToken: string): Promise<GoogleDocContent> {
  try {
    const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to fetch Google Doc ${documentId}`);
    }

    const doc = await res.json();
    const title = doc.title || 'Untitled Document';
    const headings: string[] = [];
    const textChunks: string[] = [];

    // Extract text from structural elements
    if (doc.body && Array.isArray(doc.body.content)) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          const styleType = element.paragraph.paragraphStyle?.namedStyleType || '';
          let paragraphText = '';

          if (Array.isArray(element.paragraph.elements)) {
            for (const elem of element.paragraph.elements) {
              if (elem.textRun && elem.textRun.content) {
                paragraphText += elem.textRun.content;
              }
            }
          }

          const trimmed = paragraphText.trim();
          if (trimmed) {
            if (styleType.startsWith('HEADING') || styleType === 'TITLE') {
              headings.push(trimmed);
            }
            textChunks.push(trimmed);
          }
        } else if (element.table) {
          // Table text extraction
          if (Array.isArray(element.table.tableRows)) {
            for (const row of element.table.tableRows) {
              if (Array.isArray(row.tableCells)) {
                const cellTexts: string[] = [];
                for (const cell of row.tableCells) {
                  if (Array.isArray(cell.content)) {
                    for (const cellContent of cell.content) {
                      if (cellContent.paragraph?.elements) {
                        for (const elem of cellContent.paragraph.elements) {
                          if (elem.textRun?.content?.trim()) {
                            cellTexts.push(elem.textRun.content.trim());
                          }
                        }
                      }
                    }
                  }
                }
                if (cellTexts.length > 0) {
                  textChunks.push(`[Table Row] ${cellTexts.join(' | ')}`);
                }
              }
            }
          }
        }
      }
    }

    return {
      documentId,
      title,
      headings,
      extractedText: textChunks.join('\n\n') || '(No text content detected in document)',
      revisionId: doc.revisionId,
    };
  } catch (error: any) {
    console.error('Error fetching Google Doc content:', error);
    throw error;
  }
}

/**
 * Creates a new Google Doc with specified title and content.
 * Note: Must be accompanied by user confirmation before execution.
 */
export async function createGoogleDoc(
  title: string,
  content: string,
  accessToken: string
): Promise<{ documentId: string; title: string; url: string }> {
  try {
    // 1. Create empty document
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Failed to create Google Doc');
    }

    const createdDoc = await createRes.json();
    const documentId = createdDoc.documentId;

    // 2. Insert content via batchUpdate
    if (content && content.trim()) {
      const batchRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        }),
      });

      if (!batchRes.ok) {
        console.warn('Document created but failed to populate initial text');
      }
    }

    return {
      documentId,
      title,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  } catch (error: any) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
}
