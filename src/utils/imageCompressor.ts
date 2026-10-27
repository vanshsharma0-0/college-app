/**
 * Pure calculation for scaling dimensions to maintain aspect ratio with max width
 */
export function calculateScaledDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth = 1000
): { width: number; height: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: maxWidth, height: Math.round(maxWidth * 1.33) };
  }
  if (origWidth <= maxWidth) {
    return { width: Math.round(origWidth), height: Math.round(origHeight) };
  }
  const scale = maxWidth / origWidth;
  return {
    width: Math.round(maxWidth),
    height: Math.round(origHeight * scale),
  };
}

/**
 * Compresses an image file using HTML5 canvas
 * Max width 1000px, JPEG 0.6 quality
 */
export async function compressImageFile(
  file: File | Blob,
  maxWidth = 1000,
  quality = 0.6
): Promise<{ dataUrl: string; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const { width, height } = calculateScaledDimensions(img.width, img.height, maxWidth);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to acquire canvas 2D context'));
          return;
        }

        // Draw white background for clean photo contrast
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        // Estimate base64 byte size
        const compressedSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Returns a clean SVG Data URL representing a handwritten notebook answer copy
 * Used for pre-loaded demonstration submissions so teachers can inspect right away.
 */
export function getSampleNotebookDataUrl(title: string, studentName: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
    <rect width="900" height="1200" fill="#FCFCFA" />
    <!-- Notebook Red Margin line -->
    <line x1="120" y1="0" x2="120" y2="1200" stroke="#EF4444" stroke-width="2" opacity="0.6" />
    <line x1="124" y1="0" x2="124" y2="1200" stroke="#EF4444" stroke-width="1" opacity="0.4" />
    <!-- Horizontal Ruled Lines -->
    ${Array.from({ length: 30 })
      .map(
        (_, i) =>
          `<line x1="0" y1="${120 + i * 36}" x2="900" y2="${120 + i * 36}" stroke="#CBD5E1" stroke-width="1" />`
      )
      .join('\n')}
    <!-- Header Details -->
    <text x="140" y="70" font-family="Courier, monospace" font-size="20" font-weight="bold" fill="#0F172A">COLLEGE NOTEBOOK - ASSIGNMENT ANSWER SHEET</text>
    <text x="140" y="100" font-family="Courier, monospace" font-size="15" fill="#475569">Student: ${studentName} | Date: Oct 2026</text>
    <line x1="0" y1="115" x2="900" y2="115" stroke="#94A3B8" stroke-width="2" />
    <!-- Handwritten simulation text -->
    <text x="140" y="150" font-family="sans-serif" font-size="18" font-weight="600" fill="#1E293B">Ans. ${title}</text>
    <text x="140" y="186" font-family="cursive, sans-serif" font-size="17" fill="#1E3A8A">1. Introduction &amp; Working Principle:</text>
    <text x="160" y="222" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">Dijkstra's algorithm solves the single-source shortest path problem</text>
    <text x="160" y="258" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">for a directed or undirected graph with non-negative edge weights.</text>
    <text x="160" y="294" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">It maintains a set of visited vertices whose minimum distance from</text>
    <text x="160" y="330" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">source vertex is already calculated.</text>
    
    <text x="140" y="366" font-family="cursive, sans-serif" font-size="17" fill="#1E3A8A">2. Step-by-Step Procedure:</text>
    <text x="160" y="402" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">(i) Assign distance value 0 to source node, and INFINITY to all other nodes.</text>
    <text x="160" y="438" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">(ii) Initialize min-priority queue with all vertices.</text>
    <text x="160" y="474" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">(iii) While queue is not empty, extract vertex u with minimum dist[u].</text>
    <text x="160" y="510" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">(iv) For each neighbor v of u, perform edge relaxation:</text>
    <text x="190" y="546" font-family="Courier, monospace" font-size="15" fill="#047857">if dist[u] + weight(u,v) &lt; dist[v]: dist[v] = dist[u] + weight(u,v)</text>
    
    <!-- Graph Diagram sketch -->
    <rect x="220" y="600" width="460" height="240" fill="#F8FAFC" stroke="#94A3B8" stroke-dasharray="4" rx="8" />
    <circle cx="280" cy="720" r="26" fill="#FEF08A" stroke="#CA8A04" stroke-width="2" />
    <text x="274" y="726" font-family="sans-serif" font-size="16" font-weight="bold">A</text>
    <circle cx="440" cy="650" r="26" fill="#BFDBFE" stroke="#2563EB" stroke-width="2" />
    <text x="434" y="656" font-family="sans-serif" font-size="16" font-weight="bold">B</text>
    <circle cx="440" cy="790" r="26" fill="#BFDBFE" stroke="#2563EB" stroke-width="2" />
    <text x="434" y="796" font-family="sans-serif" font-size="16" font-weight="bold">C</text>
    <circle cx="600" cy="720" r="26" fill="#BBF7D0" stroke="#16A34A" stroke-width="2" />
    <text x="594" y="726" font-family="sans-serif" font-size="16" font-weight="bold">D</text>
    <!-- Edges -->
    <line x1="304" y1="710" x2="416" y2="660" stroke="#475569" stroke-width="2" />
    <text x="350" y="675" font-family="sans-serif" font-size="14" fill="#EA580C" font-weight="bold">4</text>
    <line x1="304" y1="730" x2="416" y2="780" stroke="#475569" stroke-width="2" />
    <text x="350" y="770" font-family="sans-serif" font-size="14" fill="#EA580C" font-weight="bold">2</text>
    <line x1="464" y1="660" x2="576" y2="710" stroke="#475569" stroke-width="2" />
    <text x="520" y="675" font-family="sans-serif" font-size="14" fill="#EA580C" font-weight="bold">5</text>
    <line x1="464" y1="780" x2="576" y2="730" stroke="#475569" stroke-width="2" />
    <text x="520" y="770" font-family="sans-serif" font-size="14" fill="#EA580C" font-weight="bold">1</text>
    <line x1="440" y1="676" x2="440" y2="764" stroke="#475569" stroke-width="2" />
    <text x="448" y="725" font-family="sans-serif" font-size="14" fill="#EA580C" font-weight="bold">1</text>
    
    <text x="140" y="890" font-family="cursive, sans-serif" font-size="17" fill="#1E3A8A">3. Time &amp; Space Complexity:</text>
    <text x="160" y="926" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">• With Adjacency Matrix: O(V²)</text>
    <text x="160" y="962" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">• With Min-Heap / Priority Queue: O((V + E) log V)</text>
    <text x="160" y="998" font-family="cursive, sans-serif" font-size="16" fill="#1E3A8A">• Space Complexity: O(V) for storing distances and parent tracking.</text>
    <text x="140" y="1040" font-family="sans-serif" font-size="14" fill="#64748B">[Submitted from Student Notebook via Mobile Camera]</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
