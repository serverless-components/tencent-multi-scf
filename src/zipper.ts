import { resolve } from 'path';
import { statSync, readFileSync } from 'fs';
import * as AdmZip from 'adm-zip';
import * as fg from 'fast-glob';

export async function zip({ src, filename }: { src: string; filename: string }) {
  const adm = new AdmZip();
  const files = await fg('**/*', {
    cwd: src,
    dot: true,
  });
  if (files.length === 0) {
    throw new Error('指定 src 目录为空');
  }

  files.forEach((file) => {
    const filePath = resolve(src, file);
    const stat = statSync(filePath);
    const mode = stat.mode & 0o100 ? 0o755 : 0o644;
    adm.addFile(file, readFileSync(filePath), '', mode);
  });

  adm.writeZip(filename);
}

export async function unzip({
  filename,
  target,
  overwrite = true,
  entryName,
}: {
  filename: string;
  target: string;
  overwrite?: boolean;
  entryName?: string;
}) {
  const adm = new AdmZip(filename);
  if (entryName) {
    const entries = adm.getEntries();
    const eName = entryName.replace('./', '');
    entries.forEach((item) => {
      if (item.entryName.indexOf(eName) !== -1) {
        adm.extractEntryTo(item, target, true, overwrite);
      }
    });
  } else {
    adm.extractAllTo(target, overwrite);
  }
}
