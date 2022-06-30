import closurePlugin from '@ampproject/rollup-plugin-closure-compiler';
import { execFileSync } from 'child_process';
import ect from 'ect-bin';
import { statSync } from 'fs';
import { Input, InputAction, InputType, Packer } from 'roadroller';
import { OutputAsset, OutputChunk } from 'rollup';
import { defineConfig, IndexHtmlTransformContext, Plugin } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    polyfillModulePreload: false, // Don't add vite polyfills
    cssCodeSplit: false,
    brotliSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    closurePlugin({
      language_in: 'ECMASCRIPT_NEXT',
      language_out: 'ECMASCRIPT_NEXT',
      compilation_level: 'ADVANCED', // WHITESPACE_ONLY, SIMPLE, ADVANCED
      strict_mode_input: true,
      summary_detail_level: '3',
    }),
    roadrollerPlugin(),
    ectPlugin(),
  ],
});

/**
 * Creates the Roadroller plugin that crunches the JS and CSS.
 * @returns The roadroller plugin.
 */
function roadrollerPlugin(): Plugin {
  return {
    name: 'vite:roadroller',
    transformIndexHtml: {
      enforce: 'post',
      transform: async (html: string, ctx?: IndexHtmlTransformContext): Promise<string> => {
        // Only use this plugin during build
        if (!ctx || !ctx.bundle) {
          return html;
        }

        // First, clean up the HTML
        html = trimHtml(html);

        // Next, embed all of the assets
        for (const [, value] of Object.entries(ctx.bundle)) {
          const outputChunk = value as OutputChunk;
          const outputAsset = value as OutputAsset;
          if (outputChunk.code) {
            html = await embedJs(html, outputChunk);
          } else if (outputAsset.fileName.endsWith('.css')) {
            html = embedCss(html, outputAsset);
          } else {
            console.warn(`WARN asset not inlined: ${outputAsset.fileName}`);
          }
        }
        return html;
      },
    },
  };
}

/**
 * Performs lightweight HTML cleanup.
 * Trims all lines in the file.
 * Removes empty lines.
 * @param html The original HTML.
 * @returns Trimmed HTML.
 */
function trimHtml(html: string): string {
  return html
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Transforms the given JavaScript code into a packed version.
 * @param html The original HTML.
 * @param chunk The JavaScript output chunk from Rollup/Vite.
 * @returns The transformed HTML with the JavaScript embedded.
 */
async function embedJs(html: string, chunk: OutputChunk): Promise<string> {
  const inputs: Input[] = [
    {
      data: chunk.code.trim(),
      type: 'js' as InputType,
      action: 'eval' as InputAction,
    },
  ];
  const options = {};
  const packer = new Packer(inputs, options);
  await packer.optimize();
  const { firstLine, secondLine } = packer.makeDecoder();
  const reScript = new RegExp(`<script type="module"[^>]*?src="[\./]*${chunk.fileName}"[^>]*?></script>`);
  const code = `<script type="module">\n${firstLine}\n${secondLine}\n</script>`;
  return html.replace(reScript, (_) => code);
}

/**
 * Embeds CSS into the HTML.
 * @param html The original HTML.
 * @param asset The CSS asset.
 * @returns The transformed HTML with the CSS embedded.
 */
function embedCss(html: string, asset: OutputAsset): string {
  const reCSS = new RegExp(`<link rel="stylesheet"[^>]*?href="[\./]*${asset.fileName}"[^>]*?>`);
  const code = `<style>${(asset.source as string).trim()}</style>`;
  return html.replace(reCSS, (_) => code);
}

/**
 * Creates the ECT plugin that uses Efficient-Compression-Tool to build a zip file.
 * @returns The ECT plugin.
 */
function ectPlugin(): Plugin {
  return {
    name: 'vite:ect',
    writeBundle: async (): Promise<void> => {
      try {
        const args = ['-strip', '-zip', '-10009', 'dist/index.html', 'dist/i.png'];
        const result = execFileSync(ect, args);
        console.log('ECT result', result.toString().trim());
        const stats = statSync('dist/index.zip');
        console.log('ZIP size', stats.size);
      } catch (err) {
        console.log('ECT error', err);
      }
    },
  };
}
