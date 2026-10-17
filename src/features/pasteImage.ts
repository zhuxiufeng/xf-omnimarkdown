import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawnSync, execSync } from 'child_process';

export async function pasteImageCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showWarningMessage('Markdown Craft: Please open a Markdown file to paste image.');
    return;
  }

  const doc = editor.document;
  if (doc.isUntitled) {
    vscode.window.showWarningMessage('Markdown Craft: Please save the Markdown file first before pasting images.');
    return;
  }

  const docDir = path.dirname(doc.fileName);
  const assetsDir = path.join(docDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `image-${timestamp}.png`;
  const targetPath = path.join(assetsDir, filename);

  const success = saveClipboardImage(targetPath);
  if (!success) {
    vscode.window.showErrorMessage('Markdown Craft: No image found in clipboard or failed to save.');
    return;
  }

  // Insert markdown image link at cursor
  const relativePath = `./assets/${filename}`;
  const imageMarkdown = `![${filename}](${relativePath})\n`;

  await editor.edit(editBuilder => {
    editBuilder.insert(editor.selection.active, imageMarkdown);
  });

  vscode.window.showInformationMessage(`Markdown Craft: Image saved to ${relativePath}`);
}

function saveClipboardImage(targetPath: string): boolean {
  const isWSL = process.platform === 'linux' && fs.existsSync('/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe');

  if (isWSL) {
    return saveFromWSL(targetPath);
  } else if (process.platform === 'win32') {
    return saveFromWindows(targetPath);
  } else if (process.platform === 'darwin') {
    return saveFromMac(targetPath);
  } else {
    return saveFromLinux(targetPath);
  }
}

function saveFromWSL(targetPath: string): boolean {
  try {
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img) {
  $tmp = [System.IO.Path]::GetTempFileName() + ".png"
  $img.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output $tmp
} else {
  Write-Output "NO_IMAGE"
}
`;
    const res = spawnSync('powershell.exe', ['-NoProfile', '-Command', psScript], { encoding: 'utf8' });
    const winTmp = res.stdout ? res.stdout.trim() : '';
    if (!winTmp || winTmp === 'NO_IMAGE') return false;

    const wslTmp = execSync(`wslpath -u "${winTmp}"`, { encoding: 'utf8' }).trim();
    if (fs.existsSync(wslTmp)) {
      fs.copyFileSync(wslTmp, targetPath);
      fs.unlinkSync(wslTmp);
      return true;
    }
    return false;
  } catch (e) {
    console.error('[Markdown Craft] saveFromWSL error:', e);
    return false;
  }
}

function saveFromWindows(targetPath: string): boolean {
  try {
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img) {
  $img.Save("${targetPath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "OK"
} else {
  Write-Output "NO_IMAGE"
}
`;
    const res = spawnSync('powershell', ['-NoProfile', '-Command', psScript], { encoding: 'utf8' });
    return res.stdout ? res.stdout.trim() === 'OK' : false;
  } catch (e) {
    return false;
  }
}

function saveFromMac(targetPath: string): boolean {
  try {
    const res = spawnSync('osascript', ['-e', `
      set theFile to POSIX file "${targetPath}"
      try
        set theData to the clipboard as «class PNGf»
        set theOpen to open for access theFile with write permission
        write theData to theOpen
        close access theOpen
        return "OK"
      on error
        try
          close access theFile
        end try
        return "NO_IMAGE"
      end try
    `], { encoding: 'utf8' });
    return res.stdout ? res.stdout.trim() === 'OK' : false;
  } catch (e) {
    return false;
  }
}

function saveFromLinux(targetPath: string): boolean {
  try {
    const res = spawnSync('sh', ['-c', `xclip -selection clipboard -t image/png -o > "${targetPath}" 2>/dev/null || wl-paste -t image/png > "${targetPath}" 2>/dev/null`]);
    return fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0;
  } catch (e) {
    return false;
  }
}
