import { Platform } from "obsidian";

export async function copyTextToClipboard(text: string): Promise<void> {
  if (Platform.isDesktopApp) {
    const requireFn = (window as Window & { require?: (name: string) => unknown }).require;
    const electron = requireFn?.("electron") as { clipboard?: { writeText: (value: string) => void } } | undefined;
    if (electron?.clipboard) {
      electron.clipboard.writeText(text);
      return;
    }
  }

  if (!navigator?.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable.");
  }

  await Promise.race([
    navigator.clipboard.writeText(text),
    new Promise<never>((_resolve, reject) => {
      window.setTimeout(() => reject(new Error("Clipboard write timed out.")), 1500);
    })
  ]);
}
